
import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { NovelsService } from './novels.service';

@Controller('novels')
export class NovelsController {
  constructor(
    private readonly novels: NovelsService,
  ) {}

  /**
   * Public compatibility endpoint.
   *
   * Only published novels are returned.
   */
  @Get()
  findAll() {
    return this.novels.findPublished();
  }

  /**
   * Public compatibility endpoint.
   *
   * Only published novels are returned.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.novels.findPublishedOne(id);
  }
}

