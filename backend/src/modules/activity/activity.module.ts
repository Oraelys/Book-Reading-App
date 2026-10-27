import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { TrainingModule } from '../training/training.module';
import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { WritingAuthGuard } from '../writing/guards/writing-auth.guard';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    DatabaseModule,
    RecommendationsModule,
    TrainingModule,
  ],

  controllers: [
    ActivityController,
  ],

  providers: [
    ActivityService,
    WritingAuthGuard,
    AdminContentGuard,
  ],

  exports: [
    ActivityService,
  ],
})
export class ActivityModule {}