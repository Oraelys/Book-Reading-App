import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { extname } from 'path';

import { StorageService } from './services/storage.service';

@Injectable()
export class UploadsService {
  constructor(
    private readonly storage: StorageService,
  ) {}

  private readonly allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  private readonly maxSize =
    10 * 1024 * 1024;

  private validateFile(
    file: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded.',
      );
    }

    if (
      !this.allowedTypes.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Unsupported file type.',
      );
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException(
        'Maximum upload size is 10 MB.',
      );
    }
  }

  async uploadCover(
    file: any,
  ) {
    this.validateFile(file);

    return this.storage.uploadFile(
      'covers',
      file.buffer,
      extname(file.originalname)
        .replace('.', ''),
      file.mimetype,
    );
  }

  async uploadBanner(
    file: any,
  ) {
    this.validateFile(file);

    return this.storage.uploadFile(
      'banners',
      file.buffer,
      extname(file.originalname)
        .replace('.', ''),
      file.mimetype,
    );
  }

  async uploadAvatar(
    file: any,
  ) {
    this.validateFile(file);

    return this.storage.uploadFile(
      'avatars',
      file.buffer,
      extname(file.originalname)
        .replace('.', ''),
      file.mimetype,
    );
  }

  async delete(
    path: string,
  ) {
    return this.storage.deleteFile(
      path,
    );
  }
}