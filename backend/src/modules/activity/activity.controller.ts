import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { ActivityService } from './activity.service';

import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('activity')
export class ActivityController {
  constructor(
    private readonly activityService: ActivityService,
  ) {}

  /*
   * Track Activity
   */

  @Post()
  track(
    @Body() dto: CreateActivityDto,
  ) {
    return this.activityService.track(dto);
  }

  /*
   * User Activity
   */

  @Get('user/:userId')
  history(
    @Param('userId') userId: string,
  ) {
    return this.activityService.history(
      userId,
    );
  }

  /*
   * Novel Activity
   */

  @Get('novel/:novelId')
  novel(
    @Param('novelId') novelId: string,
  ) {
    return this.activityService.novelHistory(
      novelId,
    );
  }

  /*
   * Delete Activity
   */

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.activityService.remove(id);
  }
}