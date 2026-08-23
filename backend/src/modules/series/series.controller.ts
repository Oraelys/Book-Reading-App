import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { SeriesService } from './series.service';

import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';
import { AddNovelDto } from './dto/add-novel.dto';

@Controller('series')
export class SeriesController {
  constructor(
    private readonly seriesService: SeriesService,
  ) {}

  /*
   * Create Series
   */

  @Post()
  create(
    @Body() dto: CreateSeriesDto,
  ) {
    return this.seriesService.create(dto);
  }

  /*
   * Get One Series
   */

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.seriesService.findOne(id);
  }

  /*
   * Get Creator Series
   */

  @Get('creator/:creatorId')
  creatorSeries(
    @Param('creatorId') creatorId: string,
  ) {
    return this.seriesService.findCreatorSeries(
      creatorId,
    );
  }

  /*
   * Update Series
   */

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSeriesDto,
  ) {
    return this.seriesService.update(id, dto);
  }

  /*
   * Delete Series
   */

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.seriesService.remove(id);
  }

  /*
   * Add Novel
   */

  @Post(':id/novels')
  addNovel(
    @Param('id') id: string,
    @Body() dto: AddNovelDto,
  ) {
    return this.seriesService.addNovel(
      id,
      dto,
    );
  }

  /*
   * Remove Novel
   */

  @Delete(':id/novels/:novelId')
  removeNovel(
    @Param('id') id: string,
    @Param('novelId') novelId: string,
  ) {
    return this.seriesService.removeNovel(
      id,
      novelId,
    );
  }

  /*
   * Get Stories
   */

  @Get(':id/novels')
  getStories(
    @Param('id') id: string,
  ) {
    return this.seriesService.getStories(id);
  }

  /*
   * Reorder Stories
   */

  @Patch(':id/reorder')
  reorder(
    @Param('id') id: string,
    @Body('orderedIds') orderedIds: string[],
  ) {
    return this.seriesService.reorder(
      id,
      orderedIds,
    );
  }
}