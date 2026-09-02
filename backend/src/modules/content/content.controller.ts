import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ContentService,
} from './content.service';

import {
  WritingAuthGuard,
} from '../writing/guards/writing-auth.guard';

import {
  WritingAuthorizationService,
} from '../writing/services/writing-authorization.service';

@Controller('content')
export class ContentController {
  constructor(
    private readonly content:
      ContentService,

    private readonly authorization:
      WritingAuthorizationService,
  ) {}

  /*
   * ============================
   * AUTHOR / PROCESSING
   * ============================
   */

  @Post('upload')
  @UseGuards(WritingAuthGuard)
  async upload(
    @Body()
    body: {
      file: string;
      novelId: string;
    },

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        body.novelId,
        request.user.id,
      );

    return this.content.upload(
      body.file,
      body.novelId,
    );
  }

  @Get('jobs/:id')
  @UseGuards(WritingAuthGuard)
  async getProcessingJob(
    @Param('id')
    id: string,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertProcessingJobOwner(
        id,
        request.user.id,
      );

    return this.content
      .getProcessingJob(id);
  }

  /*
   * ============================
   * PUBLIC READER
   * ============================
   */

  @Get(
    'novels/:novelId/chapters',
  )
  async getPublishedChapters(
    @Param('novelId')
    novelId: string,
  ) {
    return this.content
      .getPublishedChapters(
        novelId,
      );
  }

  @Get(
    'novels/:novelId/chapters/:chapterNumber',
  )
  async getPublishedChapter(
    @Param('novelId')
    novelId: string,

    @Param(
      'chapterNumber',
      ParseIntPipe,
    )
    chapterNumber: number,
  ) {
    return this.content
      .getPublishedChapter(
        novelId,
        chapterNumber,
      );
  }

  /*
   * ============================
   * AUTHOR PUBLISHING
   * ============================
   */

  @Post(
    'chapters/:chapterId/publish',
  )
  @UseGuards(WritingAuthGuard)
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

    return this.content
      .publishChapter(
        chapterId,
      );
  }

  @Post(
    'chapters/:chapterId/unpublish',
  )
  @UseGuards(WritingAuthGuard)
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

    return this.content
      .unpublishChapter(
        chapterId,
      );
  }

  @Post(
    'novels/:novelId/publish',
  )
  @UseGuards(WritingAuthGuard)
  async publishNovel(
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

    return this.content
      .publishAll(
        novelId,
      );
  }

  @Post(
    'novels/:novelId/unpublish',
  )
  @UseGuards(WritingAuthGuard)
  async unpublishNovel(
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

    return this.content
      .unpublishAll(
        novelId,
      );
  }

  @Get(
    'novels/:novelId/publishing',
  )
  @UseGuards(WritingAuthGuard)
  async publishingStatus(
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

    return this.content
      .getPublishingStatus(
        novelId,
      );
  }

  /*
   * ============================
   * AUTHOR INTERNAL CHAPTERS
   * ============================
   */

  @Get(
    'admin/novels/:novelId/chapters',
  )
  @UseGuards(WritingAuthGuard)
  async getAllChapters(
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

    return this.content
      .getAllChapters(
        novelId,
      );
  }

  @Get(
    'admin/novels/:novelId/chapters/:chapterNumber',
  )
  @UseGuards(WritingAuthGuard)
  async getChapter(
    @Param('novelId')
    novelId: string,

    @Param(
      'chapterNumber',
      ParseIntPipe,
    )
    chapterNumber: number,

    @Req()
    request: any,
  ) {
    await this.authorization
      .assertNovelOwner(
        novelId,
        request.user.id,
      );

    return this.content
      .getChapter(
        novelId,
        chapterNumber,
      );
  }
}