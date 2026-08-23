import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';

import { RecommendationsService } from './recommendations.service';

@Controller(
  'recommendations',
)
export class RecommendationsController {

  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  /*
   * Home Feed
   */

  @Get('home/:userId')
  home(
    @Param('userId')
    userId: string,

    @Query('limit')
    limit?: number,
  ) {

    return this.recommendationsService.home(
      userId,
      Number(limit) || 20,
    );

  }

  /*
   * Trending
   */

  @Get('trending')
  trending() {

    return this.recommendationsService.trending();

  }

  /*
   * New
   */

  @Get('new')
  newest() {

    return this.recommendationsService.newest();

  }

  /*
   * Continue Reading
   */

  @Get(
    'continue/:userId',
  )
  continueReading(
    @Param('userId')
    userId: string,
  ) {

    return this.recommendationsService.continueReading(
      userId,
    );

  }

  /*
   * Category
   */

  @Get(
    'category/:category',
  )
  category(
    @Param('category')
    category: string,
  ) {

    return this.recommendationsService.category(
      category,
    );

  }

  /*
   * Author
   */

  @Get(
    'author/:authorId',
  )
  author(
    @Param('authorId')
    authorId: string,
  ) {

    return this.recommendationsService.author(
      authorId,
    );

  }

  /*
   * Similar
   */

  @Get(
    'similar/:novelId',
  )
  similar(
    @Param('novelId')
    novelId: string,
  ) {

    return this.recommendationsService.similar(
      novelId,
    );

  }

}