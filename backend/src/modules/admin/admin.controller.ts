import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { AdminService } from './admin.service';

@Controller('admin/dashboard')
@UseGuards(AdminContentGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
  ) {}

  @Get()
  getOverview() {
    return this.adminService.getDashboardOverview();
  }
}
