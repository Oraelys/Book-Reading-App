import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  PublishingService,
} from './publishing.service';

import {
  WritingAuthGuard,
} from '../writing/guards/writing-auth.guard';

import {
  WritingAuthorizationService,
} from '../writing/services/writing-authorization.service';

@Controller('publishing')
@UseGuards(WritingAuthGuard)
export class PublishingController {
  constructor(
    private readonly publishingService:
      PublishingService,

    private readonly authorization:
      WritingAuthorizationService,
  ) {}

  @Post('validate/:novelId')
  async validateStory(
    @Param('novelId')
    novelId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        novelId,
        request.user.id,
      );

    return this.publishingService
      .validateStory(
        novelId,
      );
  }

  @Post('story/:novelId')
  async publishStory(
    @Param('novelId')
    novelId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        novelId,
        request.user.id,
      );

    return this.publishingService
      .publishStory(
        novelId,
      );
  }

  @Post('story/:novelId/unpublish')
  async unpublishStory(
    @Param('novelId')
    novelId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        novelId,
        request.user.id,
      );

    return this.publishingService
      .unpublishStory(
        novelId,
      );
  }

  @Post('chapter/:chapterId')
  async publishChapter(
    @Param('chapterId')
    chapterId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        request.user.id,
      );

    return this.publishingService
      .publishChapter(
        chapterId,
      );
  }

  @Post(
    'chapter/:chapterId/unpublish',
  )
  async unpublishChapter(
    @Param('chapterId')
    chapterId: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertChapterOwner(
        chapterId,
        request.user.id,
      );

    return this.publishingService
      .unpublishChapter(
        chapterId,
      );
  }
}