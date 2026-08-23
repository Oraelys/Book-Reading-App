import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ChaptersService } from './chapters.service';

import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('chapters')
export class ChaptersController {
  constructor(
    private readonly chaptersService: ChaptersService,
  ) {}

  @Post()
  create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }

  @Post(':id/publish')
  publish(
    @Param('id') id: string,
  ) {
    return this.chaptersService.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(
    @Param('id') id: string,
  ) {
    return this.chaptersService.unpublish(id);
  }

  @Get('/novel/:novelId')
  getNovelChapters(
    @Param('novelId') novelId: string,
  ) {
    return this.chaptersService.getNovelChapters(
      novelId,
    );
  }
}