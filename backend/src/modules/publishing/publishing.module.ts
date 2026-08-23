import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NovelsModule } from '../novels/novels.module';
import { ChaptersModule } from '../chapters/chapters.module';

import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';

@Module({
  imports: [
    DatabaseModule,
    NovelsModule,
    ChaptersModule,
  ],
  controllers: [PublishingController],
  providers: [PublishingService],
})
export class PublishingModule {}