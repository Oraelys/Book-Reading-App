
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import {
  ContentService,
} from './content.service';

import {
  WritingAuthGuard,
} from '../writing/guards/writing-auth.guard';

import {
  WritingAuthorizationService,
} from '../writing/services/writing-authorization.service';

import {
  AdminContentGuard,
} from './guards/admin-content.guard';

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
   * ADMIN BOOK IMPORT
   * ============================
   *
   * Only administrators may
   * introduce manuscript files.
   *
   * The administrator performing
   * the import is NOT automatically
   * treated as the book's author.
   */

  @Post('admin/import')
  @UseGuards(AdminContentGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize:
          50 * 1024 * 1024,
      },
    }),
  )
  async importBook(
    @UploadedFile()
    file: any,

    @Body()
    body: {
      novelId: string;
    },

    @Req()
    request: any,
  ) {
    if (!file) {
      throw new BadRequestException(
        'A manuscript file is required.',
      );
    }

    if (
      !body?.novelId ||
      typeof body.novelId !== 'string'
    ) {
      throw new BadRequestException(
        'novelId is required.',
      );
    }

    return this.content.importBook(
      file,
      body.novelId,
      request.user.id,
    );
  }

  /*
   * ============================
   * PROCESSING JOBS
   * ============================
   */

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

