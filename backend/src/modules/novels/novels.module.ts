import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { NovelsController } from './novels.controller';
import { NovelsService } from './novels.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NovelsController],
  providers: [NovelsService],
  exports: [NovelsService],
})
export class NovelsModule {}