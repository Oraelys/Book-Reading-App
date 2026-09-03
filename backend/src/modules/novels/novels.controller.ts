
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
   * Author mutations belong to the canonical
   * /writing/stories API.
   */
  @Get()
  findAll() {
    return this.novels.findAll();
  }

  /**
   * Public compatibility endpoint.
   *
   * Only published novels should be exposed
   * through this public route.
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.novels.findOne(id);
  }
}

