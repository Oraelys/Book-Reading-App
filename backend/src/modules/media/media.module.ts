import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { MediaController } from './media.controller';
import { MediaService } from './media.service';

import { StorageService } from './services/storage.service';
import { MediaValidationService } from './services/media-validation.service';
import { ImageService } from './services/image.service';

@Module({
  imports: [DatabaseModule],

  controllers: [
    MediaController,
  ],

  providers: [
    MediaService,
    StorageService,
    MediaValidationService,
    ImageService,
  ],

  exports: [
    MediaService,
    StorageService,
  ],
})
export class MediaModule {}