import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { WritingService } from '../services/writing.service';

import { CreateStoryDto } from '../dto/create-story.dto';
import { UpdateStoryDto } from '../dto/update-story.dto';

@Controller('writing')
export class WritingController {
  constructor(
    private readonly writingService:
      WritingService,
  ) {}

  /*
   * ==========================================
   * Stories
   * ==========================================
   */

  @Post('stories')
  createStory(
    @Body()
    dto: CreateStoryDto,
  ) {
    return this.writingService.createStory(
      dto,
    );
  }

  @Get('stories')
  getStories() {
    return this.writingService.stories();
  }

  @Get('stories/:id')
  getStory(
    @Param('id')
    id: string,
  ) {
    return this.writingService.story(id);
  }

  @Patch('stories/:id')
  updateStory(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateStoryDto,
  ) {
    return this.writingService.updateStory(
      id,
      dto,
    );
  }

  @Delete('stories/:id')
  deleteStory(
    @Param('id')
    id: string,
  ) {
    return this.writingService.deleteStory(
      id,
    );
  }
}