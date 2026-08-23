import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { NovelsService } from './novels.service';

@Controller('novels')
export class NovelsController {
  constructor(
    private readonly novels: NovelsService,
  ) {}

  @Post()
  create(
    @Body() dto: any,
  ) {
    return this.novels.create(dto);
  }

  @Get()
  findAll() {
    return this.novels.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.novels.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.novels.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.novels.delete(id);
  }
}