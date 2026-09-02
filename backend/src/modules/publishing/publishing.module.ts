import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { WritingModule } from '../writing/writing.module';

import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';

@Module({
  imports: [
    DatabaseModule,
    WritingModule,
  ],

  controllers: [
    PublishingController,
  ],

  providers: [
    PublishingService,
  ],

  exports: [
    PublishingService,
  ],
})
export class PublishingModule {}