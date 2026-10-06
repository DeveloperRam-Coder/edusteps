import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthModule } from '../auth/auth.module';

import { FileUploadService } from '../../../infrastructure/storage/file-upload.service';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserService, FileUploadService],
})
export class UserModule { }
