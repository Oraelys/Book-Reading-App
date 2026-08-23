import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DraftsService } from './drafts.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';

@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly draftsService: DraftsService,
  ) {}

  @Post()
  create(@Body() dto: CreateDraftDto) {
    return this.draftsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.draftsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDraftDto,
  ) {
    return this.draftsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.draftsService.remove(id);
  }
}