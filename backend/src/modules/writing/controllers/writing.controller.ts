import {
    Body,
    Controller,
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
        private readonly writingService: WritingService,
    ) {}

    @Post('stories')
    createStory(
        @Body()
        dto: CreateStoryDto,
    ) {
        return this.writingService.createStory(dto);
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

    @Get('stories/:id')
    getStory(
        @Param('id')
        id: string,
    ) {
        return this.writingService.story(id);
    }

    @Get('stories')
    getStories() {
        return this.writingService.stories();
    }
}