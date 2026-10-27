import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminContentGuard,
  ],
  exports: [AdminService],
})
export class AdminModule {}
