import { Body, Controller, Post, Req, Put, Param, Get, ForbiddenException, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { ResetPwdDto } from './dto/reset-pwd.dto';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';
import { FileUploadService } from '../../../infrastructure/storage/file-upload.service';

@Controller('users')
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileUploadService: FileUploadService,
  ) { }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  getCurrentUser(@Req() req: any) {
    return this.userService.findById(req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  updateProfile(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: any) {
    // Ensure users can only update their own profile
    if (req.user.id !== id) {
      throw new ForbiddenException('Cannot update another user profile');
    }
    return this.userService.update(id, dto);
  }

  // @Post("resetpwd")
  // @ApiOperation({summary:'Reset user password using token'})
  // @ApiResponse({status:200,description:'Password reset successful'})
  // resetPassword(@Body() dto:ResetPwdDto){
  //   return this.userService.resetPassword(dto);
  // }
  @Post('change-password')
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password change successful' })
  changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  deleteAccount(@Param('id') id: string, @Req() req: any) {
    // Ensure users can only delete their own profile
    if (req.user.id !== id) {
      throw new ForbiddenException('Cannot delete another user profile');
    }
    return this.userService.delete(id);
  }

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: any, @Req() req: any) {
    const avatarUrl = await this.fileUploadService.uploadAvatar(file);
    return this.userService.update(req.user.id, { avatar: avatarUrl });
  }
}


