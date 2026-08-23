import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';

import { DiscoveryService } from './discovery.service';

import { SearchDto } from './dto/search.dto';

@Controller('discovery')
export class DiscoveryController{

    constructor(
        private readonly discoveryService:DiscoveryService,
    ){}

    @Post('search')
    search(
        @Body() dto:SearchDto,
    ){
        return this.discoveryService.search(dto);
    }

    @Get('featured')
    featured(){
        return this.discoveryService.featured();
    }

    @Get('trending')
    trending(){
        return this.discoveryService.trending();
    }

    @Get('new')
    newest(){
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

@Get('continue/:userId')
continueReading(
  @Param('userId') userId: string,
) {
  return this.discoveryService.continueReading(
    userId,
  );
}

}