import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NovelsModule } from '../novels/novels.module';

import { ChaptersController } from './chapters.controller';
import { ChaptersService } from './chapters.service';

@Module({
  imports: [
    DatabaseModule,
    NovelsModule, // <-- required
  ],
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}