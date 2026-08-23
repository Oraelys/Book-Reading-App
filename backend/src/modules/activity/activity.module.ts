import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { EventsModule } from '../events/events.module';

import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { TrainingModule } from '../training/training.module';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    RecommendationsModule,
    TrainingModule
  ],

  controllers: [
    ActivityController,
  ],

  providers: [
    ActivityService,
  ],

  exports: [
    ActivityService,
  ],
})
export class ActivityModule {}