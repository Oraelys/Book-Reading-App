import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';

import type { Request } from 'express';

import { SupabaseService } from '../database/supabase.service';
import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { WritingAuthGuard } from '../writing/guards/writing-auth.guard';

import { ActivityService } from './activity.service';
import { CreateActivityDto } from './dto/create-activity.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('activity')
@UseGuards(WritingAuthGuard)
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
    private readonly database: SupabaseService,
  ) {}

  /**
   * Track activity for the authenticated user.
   * The body cannot impersonate another user.
   */
  @Post()
  track(
    @Body() dto: CreateActivityDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.activityService.track(
      dto,
      request.user.id,
    );
  }

  /**
   * A user may only read their own timeline.
   */
  @Get('user/:userId')
  async history(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    if (request.user.id !== userId) {
      const { data: profile, error } = await this.database
        .getClient()
        .from('profiles')
        .select('role')
        .eq('id', request.user.id)
        .maybeSingle();

      if (error || profile?.role !== 'admin') {
        throw new ForbiddenException(
          'You are not allowed to access this activity history.',
        );
      }
    }

    return this.activityService.history(userId);
  }

  /**
   * Cross-user activity for a novel is administrator-only.
   */
  @Get('novel/:novelId')
  @UseGuards(AdminContentGuard)
  novel(
    @Param('novelId') novelId: string,
  ) {
    return this.activityService.novelHistory(novelId);
  }

  /**
   * The service scopes deletion to the authenticated user.
   */
  @Delete(':id')
remove(
  @Param('id') id: string,
  @Req() request: AuthenticatedRequest,
) {
  return this.activityService.remove(id, request.user.id);
}
}