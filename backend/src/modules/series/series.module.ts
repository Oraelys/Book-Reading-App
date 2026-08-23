import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { NovelsModule } from '../novels/novels.module';

import { SeriesController } from './series.controller';
import { SeriesService } from './series.service';

@Module({
  imports: [
    DatabaseModule,
    NovelsModule,
  ],
  controllers: [
    SeriesController,
  ],
  providers: [
    SeriesService,
  ],
  exports: [
    SeriesService,
  ],
})
export class SeriesModule {}