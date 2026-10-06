import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async create(dto: CreateUserDto) {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.users.create({
      data: {
        email: dto.email,
        mobile: dto.mobile || null,
        name: dto.name,
        password: hashed,
        updated_at: new Date(),
      },
    });
    return { id: user.id, email: user.email, mobile: user.mobile, name: user.name };
  }

  async findById(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.users.findUnique({
        where: { email: dto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already in use');
      }
    }

    const updated = await this.prisma.users.update({
      where: { id: userId },
      data: {
        name: dto.name !== undefined ? dto.name : user.name,
        email: dto.email !== undefined ? dto.email : user.email,
        mobile: dto.mobile !== undefined ? dto.mobile : user.mobile,
        avatar: dto.avatar !== undefined ? dto.avatar : user.avatar,
        updated_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        mobile: true,
        name: true,
        avatar: true,
        created_at: true,
        updated_at: true,
      },
    });

    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old Password Incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
    return { message: 'Password changed successfully' };
  }

  async delete(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.users.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }
}
