import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { MediaFile } from '../interfaces/media-file.interface';

@Injectable()
export class MediaValidationService {
  private readonly maxImageSize =
    10 * 1024 * 1024;

  private readonly imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ];

  validateImage(
    file: MediaFile,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No file uploaded.',
      );
    }

    if (
      !this.imageMimeTypes.includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Unsupported image type.',
      );
    }

    if (
      file.size >
      this.maxImageSize
    ) {
      throw new BadRequestException(
        'Image exceeds 10MB.'
      );
    }

    return true;
  }

  validateAudio(
    file: MediaFile,
  ) {
    if (!file) {
      throw new BadRequestException(
        'No audio uploaded.',
      );
    }

    return true;
  }
}