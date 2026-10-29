
import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { AdminService } from './admin.service';

@Controller('admin/users')
@UseGuards(AdminContentGuard)
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listUsers(search, role);
  }
}
