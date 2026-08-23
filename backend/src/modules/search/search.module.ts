import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ActivityModule } from '../activity/activity.module';

import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchAnalyticsService } from './search-analytics.service';

@Module({

  imports: [
    DatabaseModule,
    AnalyticsModule,
    ActivityModule,
  ],

  controllers: [
    SearchController,
  ],

  providers: [
    SearchService,
    SearchAnalyticsService,
],

  exports: [
    SearchService,
    SearchAnalyticsService,
  ],

})
export class SearchModule {}