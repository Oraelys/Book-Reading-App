import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { WritingService } from '../services/writing.service';
import { WritingAuthorizationService } from '../services/writing-authorization.service';
import { WritingAuthGuard } from '../guards/writing-auth.guard';

import { CreateStoryDto } from '../dto/create-story.dto';
import { UpdateStoryDto } from '../dto/update-story.dto';

@Controller('writing')
@UseGuards(WritingAuthGuard)
export class WritingController {
  constructor(
    private readonly writingService:
      WritingService,

    private readonly authorization:
      WritingAuthorizationService,
  ) {}

  @Post('stories')
  createStory(
    @Body()
    dto: CreateStoryDto,

    @Req()
    request: any,
  ) {
    return this.writingService.createStory(
      dto,
      request.user.id,
    );
  }

  @Get('stories')
getStories(
  @Req()
  request: any,
) {
  return this.writingService.stories(
    request.user.id,
  );
}

  @Get('stories/:id')
  async getStory(
    @Param('id')
    id: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        id,
        request.user.id,
      );

    return this.writingService.story(
      id,
    );
  }

  @Patch('stories/:id')
  async updateStory(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateStoryDto,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        id,
        request.user.id,
      );

    return this.writingService.updateStory(
      id,
      dto,
    );
  }

  @Delete('stories/:id')
  async deleteStory(
    @Param('id')
    id: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        id,
        request.user.id,
      );

    return this.writingService.deleteStory(
      id,
    );
  }
}