import { Injectable, Logger, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 10;

function isSystemError(err: unknown): boolean {
  // Errors that are NOT "wrong credentials" — database connection issues,
  // Prisma adapter errors, network failures, bcrypt misconfiguration, etc.
  if (!err || typeof err !== 'object') return true;
  const code = (err as any).code;
  const msg = (err as any).message || '';

  if (typeof code === 'string' && code.startsWith('P')) return true;       // Any Prisma error (P2002 etc.)
  if (typeof code === 'number' && String(code).startsWith('5')) return true; // 5xx DB SQLSTATE
  if (/connect|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|pool|authentication failed|password authentication/i.test(msg)) return true;
  if (/invalid.*database|database.*url/i.test(msg)) return true;
  if (err instanceof InternalServerErrorException) return true;
  return false;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, pass: string) {
    const trimmed = identifier.trim();
    const digits = trimmed.replace(/\D/g, '');
    const isMobile = /^\d{10,15}$/.test(digits);
    const normalizedEmail = trimmed.toLowerCase();

    let user: any = null;
    try {
      // Look up by mobile OR email — normalize mobile input and support exact and suffix matches.
      user = isMobile
        ? await this.prisma.users.findFirst({
            where: {
              OR: [
                { mobile: digits },
                { mobile: digits.slice(-10) },
                { mobile: { endsWith: digits } },
                { mobile: { endsWith: digits.slice(-10) } },
              ],
            },
          })
        : await this.prisma.users.findUnique({ where: { email: normalizedEmail } });
    } catch (error) {
      // Prisma / DB errors are NEVER "bad credentials" — log full error and
      // rethrow so the caller (controller) surfaces a 500 not a 401.
      this.logger.error(`DB lookup failed for identifier "${trimmed}": ${(error as Error)?.message || String(error)}`);
      if (isSystemError(error)) {
        throw new InternalServerErrorException(
          'Authentication service temporarily unavailable. Please try again in a moment.',
        );
      }
      throw error;
    }

    if (!user) {
      this.logger.warn(`Login attempt for non-existent identifier: ${trimmed}`);
      return null;
    }

    if (!user.password) {
      this.logger.warn(`User ${trimmed} has no password set`);
      return null;
    }

    if (user.account_status !== 'active') {
      this.logger.warn(`Login attempt for inactive account: ${trimmed}`);
      return null;
    }

    let match = false;
    try {
      match = await bcrypt.compare(pass, user.password);
    } catch (error) {
      this.logger.error(`bcrypt.compare failed for ${trimmed}: ${(error as Error).message}`);
      throw new InternalServerErrorException('Password verification failed');
    }
    if (!match) {
      this.logger.warn(`Invalid password for: ${trimmed}`);
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Update last login — non-blocking, failures don't prevent login response
    this.prisma.users
      .update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      })
      .catch((err) =>
        this.logger.warn(`Could not update last_login_at for ${user.id}: ${err?.message || err}`),
      );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: this.jwtService['options']?.signOptions?.expiresIn || 3600,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        mobile: user.mobile,
        avatar: user.avatar,
        account_status: user.account_status,
      },
    };
  }

  async logout(userId: string) {
    this.logger.log(`User logout requested for ${userId}`);
    // No persistent refresh token store exists yet, so logout is currently a no-op.
    // This ensures the endpoint resolves successfully for stateless JWT sessions.
    return;
  }

  async register(dto: RegisterDto) {
    let existingUser: any;
    try {
      existingUser = await this.prisma.users.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
    } catch (error) {
      this.logger.error(`Register DB lookup failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Registration service temporarily unavailable');
    }

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    let hashedPassword: string;
    try {
      hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS);
    } catch (error) {
      this.logger.error(`bcrypt.hash failed during register: ${(error as Error).message}`);
      throw new InternalServerErrorException('Could not create account');
    }

    let user: any;
    try {
      user = await this.prisma.users.create({
        data: {
          email: dto.email.toLowerCase().trim(),
          password: hashedPassword,
          name: dto.name?.trim() || '',
          mobile: dto.mobile || null,
          avatar: null,
          account_status: 'active',
          email_verified: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`User create failed: ${(error as Error).message}`);
      throw new InternalServerErrorException('Could not create account');
    }

    this.logger.log(`User registered: ${user.email}`);
    return this.login(user);
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        mobile: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
