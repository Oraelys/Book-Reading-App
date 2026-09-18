import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AdminRecoveryController } from './admin-recovery.controller';
import { AdminRecoveryService } from './admin-recovery.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminRecoveryController],
  providers: [AdminRecoveryService],
})
export class AdminRecoveryModule {}
