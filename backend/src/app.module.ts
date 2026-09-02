import { ScheduleModule } from '@nestjs/schedule';
import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './modules/database/database.module';
import { TestModule } from './test/test.module';
import { BooksModule } from './books/books.module';
import { ProcessingModule } from './processing/processing.module';

import { NovelsModule } from './modules/novels/novels.module';
import { PublishingModule } from './modules/publishing/publishing.module';
import { MediaModule } from './modules/media/media.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SeriesModule } from './modules/series/series.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ActivityModule } from './modules/activity/activity.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EventsModule } from './modules/events/events.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { SearchModule } from './modules/search/search.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { FeaturesModule } from './modules/features/features.module';
import { DatasetModule } from './modules/dataset/dataset.module';
import { AiModule } from './modules/ai/ai.module';
import { MlopsModule } from './modules/mlops/mlops.module';
import { ContentModule } from './modules/content/content.module';
import { WritingModule } from './modules/writing/writing.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,

    TestModule,

    BooksModule,

    ProcessingModule,

    /*
     * Canonical novel/story domain.
     */
    NovelsModule,

    /*
     * Canonical publishing domain.
     */
    PublishingModule,

    MediaModule,

    UploadsModule,

    SeriesModule,

    DiscoveryModule,

    ActivityModule,

    NotificationsModule,

    EventsModule,

    AnalyticsModule,

    RecommendationsModule,

    SearchModule,

    PreferencesModule,

    FeaturesModule,

    DatasetModule,

    AiModule,

    MlopsModule,

    ContentModule,

    /*
     * Canonical author writing domain.
     *
     * This replaces the old standalone drafts/
     * and chapters/ implementations.
     */
    WritingModule,
  ],
})
export class AppModule {}