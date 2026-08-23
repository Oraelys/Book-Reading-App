import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { NotificationsService } from './notifications.service';

import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {

  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /*
   * Create
   */

  @Post()
  create(
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notificationsService.create(dto);
  }

  /*
   * Feed
   */

  @Get(':userId')
  feed(
    @Param('userId') userId: string,
  ) {
    return this.notificationsService.findAll(userId);
  }

  /*
   * Unread
   */

  @Get(':userId/unread')
  unread(
    @Param('userId') userId: string,
  ) {
    return this.notificationsService.unread(userId);
  }

  /*
   * Count
   */

  @Get(':userId/count')
  count(
    @Param('userId') userId: string,
  ) {
    return this.notificationsService.unreadCount(userId);
  }

  /*
   * Mark Read
   */

  @Patch(':id/read')
  markRead(
    @Param('id') id: string,
  ) {
    return this.notificationsService.markRead(id);
  }

  /*
   * Mark All
   */

  @Patch(':userId/read-all')
  markAll(
    @Param('userId') userId: string,
  ) {
    return this.notificationsService.markAllRead(userId);
  }

  /*
   * Delete
   */

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.notificationsService.remove(id);
  }
}