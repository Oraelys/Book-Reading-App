import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { DiscoveryService } from './discovery.service';

import { SearchDto } from './dto/search.dto';

import {
  WritingAuthGuard,
} from '../writing/guards/writing-auth.guard';

@Controller('discovery')
export class DiscoveryController {
  constructor(
    private readonly discoveryService: DiscoveryService,
  ) {}

  @Post('search')
  search(
    @Body() dto: SearchDto,
  ) {
    return this.discoveryService.search(dto);
  }

  @Get('featured')
  featured() {
    return this.discoveryService.featured();
  }

  @Get('trending')
  trending() {
    return this.discoveryService.trending();
  }

  @Get('new')
  newest() {
    return this.discoveryService.newReleases();
  }

  @Get('recent')
  recentlyUpdated() {
    return this.discoveryService.recentlyUpdated();
  }

  @Get('category/:category')
  category(
    @Param('category') category: string,
  ) {
    return this.discoveryService.byCategory(
      category,
    );
  }

  @Get('author/:authorId')
  author(
    @Param('authorId') authorId: string,
  ) {
    return this.discoveryService.byAuthor(
      authorId,
    );
  }

  /**
   * Continue Reading
   *
   * This endpoint is user-specific.
   *
   * Authentication is required and the supplied
   * userId must match the authenticated account.
   */
  @Get('continue/:userId')
  @UseGuards(WritingAuthGuard)
  continueReading(
    @Param('userId') userId: string,
    @Req() request: any,
  ) {
    if (userId !== request.user.id) {
      throw new ForbiddenException(
        'You can only access your own reading progress.',
      );
    }

    return this.discoveryService.continueReading(
      request.user.id,
    );
  }
}