import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

import { TrackEventDto } from './dto/track-event.dto';

@Controller('analytics')
export class AnalyticsController {

  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('track')
  track(
    @Body() dto: TrackEventDto,
  ) {
    return this.analyticsService.track(dto);
  }

  @Get('reader/:userId')
  reader(
    @Param('userId') userId: string,
  ) {
    return this.analyticsService.readerStats(userId);
  }

  @Get('novel/:novelId')
  novel(
    @Param('novelId') novelId: string,
  ) {
    return this.analyticsService.novelStats(novelId);
  }

  @Get('author/:authorId')
  author(
    @Param('authorId') authorId: string,
  ) {
    return this.analyticsService.authorStats(authorId);
  }
}