import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RecommendationsService } from './recommendations.service';

import {
  WritingAuthGuard,
} from '../writing/guards/writing-auth.guard';

@Controller(
  'recommendations',
)
export class RecommendationsController {
  constructor(
    private readonly recommendationsService:
      RecommendationsService,
  ) {}

  /*
   * =====================================
   * Home Feed
   * =====================================
   *
   * Personalized data belongs to the
   * authenticated user.
   */

  @Get('home/:userId')
  @UseGuards(WritingAuthGuard)
  home(
    @Param('userId')
    userId: string,

    @Req()
    request: any,

    @Query('limit')
    limit?: number,
  ) {
    if (userId !== request.user.id) {
      throw new ForbiddenException(
        'You can only access your own recommendations.',
      );
    }

    return this.recommendationsService.home(
      request.user.id,
      Number(limit) || 20,
    );
  }

  /*
   * =====================================
   * Trending
   * =====================================
   */

  @Get('trending')
  trending() {
    return this.recommendationsService.trending();
  }

  /*
   * =====================================
   * New
   * =====================================
   */

  @Get('new')
  newest() {
    return this.recommendationsService.newest();
  }

  /*
   * =====================================
   * Continue Reading
   * =====================================
   */

  @Get(
    'continue/:userId',
  )
  @UseGuards(WritingAuthGuard)
  continueReading(
    @Param('userId')
    userId: string,

    @Req()
    request: any,
  ) {
    if (userId !== request.user.id) {
      throw new ForbiddenException(
        'You can only access your own reading progress.',
      );
    }

    return this.recommendationsService.continueReading(
      request.user.id,
    );
  }

  /*
   * =====================================
   * Category
   * =====================================
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
   * =====================================
   * Author
   * =====================================
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
   * =====================================
   * Similar
   * =====================================
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