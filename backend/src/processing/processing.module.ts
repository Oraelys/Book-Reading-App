import {
  Module,
} from '@nestjs/common';

import {
  ProcessingController,
} from './processing.controller';

import {
  ProcessingService,
} from './processing.service';

import {
  DatabaseModule,
} from '../modules/database/database.module';

@Module({
  imports: [
    DatabaseModule,
  ],

  controllers: [
    ProcessingController,
  ],

  providers: [
    ProcessingService,
  ],

  exports: [
    ProcessingService,
  ],
})
export class ProcessingModule {}