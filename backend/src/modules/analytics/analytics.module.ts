import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DiscoveryModule } from '../discovery/discovery.module';
import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { WritingAuthGuard } from '../writing/guards/writing-auth.guard';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [
    DatabaseModule,
    DiscoveryModule,
  ],

  controllers: [
    AnalyticsController,
  ],

  providers: [
    AnalyticsService,
    WritingAuthGuard,
    AdminContentGuard,
  ],

  exports: [
    AnalyticsService,
  ],
})
export class AnalyticsModule {}