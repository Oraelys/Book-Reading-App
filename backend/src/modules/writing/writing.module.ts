import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { WritingController } from './controllers/writing.controller';
import { ChapterController } from './controllers/chapter.controller';
import { DraftController } from './controllers/draft.controller';

import { WritingService } from './services/writing.service';
import { ChapterService } from './services/chapter.service';
import { DraftService } from './services/draft.service';

import { ChapterAutosaveService } from './providers/chapter-autosave.service';
import { ChapterHistoryService } from './providers/chapter-history.service';
import { ChapterVersionService } from './providers/chapter-version.service';
import { ChapterMetricsService } from './providers/chapter-metrics.service';
import { ChapterOrderService } from './providers/chapter-order.service';
import { ChapterLockService } from './providers/chapter-lock.service';
import { ChapterPublishService } from './providers/chapter-publish.service';
import { ChapterSearchService } from './providers/chapter-search.service';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    WritingController,
    ChapterController,
    DraftController,
  ],

  providers: [
    // Core domain services
    WritingService,
    ChapterService,
    DraftService,

    // Chapter infrastructure
    ChapterAutosaveService,
    ChapterHistoryService,
    ChapterVersionService,
    ChapterMetricsService,
    ChapterOrderService,
    ChapterLockService,
    ChapterPublishService,
    ChapterSearchService,
  ],

  exports: [
    WritingService,
    ChapterService,
    DraftService,

    ChapterAutosaveService,
    ChapterHistoryService,
    ChapterVersionService,
    ChapterMetricsService,
    ChapterOrderService,
    ChapterLockService,
    ChapterPublishService,
    ChapterSearchService,
  ],
})
export class WritingModule {}