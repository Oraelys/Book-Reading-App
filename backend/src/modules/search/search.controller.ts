import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';

import { SearchService } from './search.service';

@Controller('search')
export class SearchController {

  constructor(

    private readonly searchService: SearchService,

  ) {}

  @Get()

  search(

    @Query('q')
    query: string,

    @Query('page')
    page?: number,

    @Query('limit')
    limit?: number,

  ) {

    return this.searchService.search(

      query,

      Number(page) || 1,

      Number(limit) || 20,

    );

  }

  @Get('autocomplete')

  autocomplete(

    @Query('q')
    query: string,

  ) {

    return this.searchService.autocomplete(query);

  }

  @Get('trending')

  trending() {

    return this.searchService.trending();

  }

}