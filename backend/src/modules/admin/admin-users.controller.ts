
import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { AdminService } from './admin.service';
import type { Request } from 'express';

@Controller('admin/users')
@UseGuards(AdminContentGuard)
export class AdminUsersController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  listUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.listU

  @Post('role')
  changeRole(
    @Req() request: Request & { user: { id: string } },
    @Body() body: { userId?: string; role?: string },
  ) {
    if (
      typeof body?.userId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.userId) ||
      typeof body?.role !== 'string'
    ) {
      throw new BadRequestException('A valid user ID and role are required.');
    }

    return this.adminService.changeUserRole(request.user.id, body.userId, body.role);
  }
sers(search, role);
  }
}
