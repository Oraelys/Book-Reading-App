import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    StorageService,
  ],
  exports: [
    UploadsService,
    StorageService,
  ],
})
export class UploadsModule {}