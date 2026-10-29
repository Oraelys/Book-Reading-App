
import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AdminContentGuard } from '../content/guards/admin-content.guard';
import {
  AdminDashboardOverview,
  AdminService,
} from './admin.service';

@Controller('admin/dashboard')
@UseGuards(AdminContentGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get()
  getOverview(): Promise<AdminDashboardOverview> {
    return this.adminService.getDashboardOverview();
  }
}
