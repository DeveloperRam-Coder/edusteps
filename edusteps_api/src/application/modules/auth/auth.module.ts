import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GlobalJwtAuthGuard } from './guards/global-jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: (config.get('jwt.expiresIn') ?? '24h') as any },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, GlobalJwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, GlobalJwtAuthGuard, JwtModule],
})
export class AuthModule {}
