import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { SupabaseService } from '../database/supabase.service';
import { AdminContentGuard } from '../content/guards/admin-content.guard';
import { WritingAuthGuard } from '../writing/guards/writing-auth.guard';

import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';

type AuthenticatedRequest = Request & {
  user: {
    id: string;
  };
};

@Controller('analytics')
@UseGuards(WritingAuthGuard)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly database: SupabaseService,
  ) {}

@Post('track')
track(
  @Body() dto: TrackEventDto,
  @Req() request: AuthenticatedRequest,
) {
  return this.analyticsService.trackClientEvent({
    ...dto,
    userId: request.user.id,
  });
}

  @Get('reader/:userId')
  async reader(
    @Param('userId') userId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.assertSelfOrAdmin(request.user.id, userId);

    return this.analyticsService.readerStats(userId);
  }

  @Get('novel/:novelId')
  async novel(
    @Param('novelId') novelId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.assertNovelOwnerOrAdmin(
      request.user.id,
      novelId,
    );

    return this.analyticsService.novelStats(novelId);
  }

  @Get('author/:authorId')
  async author(
    @Param('authorId') authorId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    await this.assertSelfOrAdmin(
      request.user.id,
      authorId,
    );

    return this.analyticsService.authorStats(authorId);
  }

  private async assertSelfOrAdmin(
    authenticatedUserId: string,
    requestedUserId: string,
  ): Promise<void> {
    if (authenticatedUserId === requestedUserId) {
      return;
    }

    if (await this.isAdmin(authenticatedUserId)) {
      return;
    }

    throw new ForbiddenException(
      'You are not allowed to access these analytics.',
    );
  }

  private async assertNovelOwnerOrAdmin(
    authenticatedUserId: string,
    novelId: string,
  ): Promise<void> {
    const { data: novel, error } = await this.database
      .getClient()
      .from('novels')
      .select('id, created_by')
      .eq('id', novelId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to verify novel ownership.',
      );
    }

    if (!novel) {
      throw new NotFoundException('Novel not found.');
    }

    if (novel.created_by === authenticatedUserId) {
      return;
    }

    if (await this.isAdmin(authenticatedUserId)) {
      return;
    }

    throw new ForbiddenException(
      'You are not allowed to access these novel analytics.',
    );
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const { data: profile, error } = await this.database
      .getClient()
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        'Unable to verify administrator permissions.',
      );
    }

    return profile?.role === 'admin';
  }
}