import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, extname, join, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
    private readonly uploadPath = join(process.cwd(), 'uploads');
    private readonly avatarPath = join(this.uploadPath, 'avatars');

    constructor() {
        this.ensureDirectoryExists(this.uploadPath);
        this.ensureDirectoryExists(this.avatarPath);
    }

    private ensureDirectoryExists(path: string) {
        if (!existsSync(path)) {
            mkdirSync(path, { recursive: true });
        }
    }

    async uploadAvatar(file: any): Promise<string> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            throw new BadRequestException('File is too large. Maximum size is 5MB.');
        }

        // Sanitize: use only the extension from the original name (uuid provides the base)
        const safeExt = extname(basename(file.originalname)).toLowerCase();
        const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];
        if (!allowedExts.includes(safeExt)) {
            throw new BadRequestException('Invalid file extension.');
        }
        const filename = `${uuidv4()}${safeExt}`;
        const filePath = join(this.avatarPath, filename);
        // Guard: ensure resolved path is still inside avatarPath
        if (!resolve(filePath).startsWith(resolve(this.avatarPath))) {
            throw new BadRequestException('Invalid file path.');
        }

        writeFileSync(filePath, file.buffer);

        return `/uploads/avatars/${filename}`;
    }
}
