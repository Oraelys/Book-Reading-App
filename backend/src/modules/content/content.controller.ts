import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import {
  ContentService,
} from './content.service';

@Controller('content')
export class ContentController {
  constructor(
    private readonly content:
      ContentService,
  ) {}

  @Post('upload')
  async upload(
    @Body()
    body: {
      file: string;
      novelId: string;
    },
  ) {
    return this.content.upload(
      body.file,
      body.novelId,
    );
  }

  @Get('jobs/:id')
  async getProcessingJob(
    @Param('id')
    id: string,
  ) {
    return this.content
      .getProcessingJob(id);
  }

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

  @Post(
  'chapters/:chapterId/publish',
)
async publishChapter(
  @Param('chapterId')
  chapterId: string,
) {
  return this.content
    .publishChapter(
      chapterId,
    );
}

@Post(
  'chapters/:chapterId/unpublish',
)
async unpublishChapter(
  @Param('chapterId')
  chapterId: string,
) {
  return this.content
    .unpublishChapter(
      chapterId,
    );
}

@Post(
  'novels/:novelId/publish',
)
async publishNovel(
  @Param('novelId')
  novelId: string,
) {
  return this.content
    .publishAll(
      novelId,
    );
}

@Post(
  'novels/:novelId/unpublish',
)
async unpublishNovel(
  @Param('novelId')
  novelId: string,
) {
  return this.content
    .unpublishAll(
      novelId,
    );
}

@Get(
  'novels/:novelId/publishing',
)
async publishingStatus(
  @Param('novelId')
  novelId: string,
) {
  return this.content
    .getPublishingStatus(
      novelId,
    );
}

@Get(
  'admin/novels/:novelId/chapters',
)
async getAllChapters(
  @Param('novelId')
  novelId: string,
) {
  return this.content
    .getAllChapters(
      novelId,
    );
}

@Get(
  'admin/novels/:novelId/chapters/:chapterNumber',
)
async getChapter(
  @Param('novelId')
  novelId: string,

  @Param(
    'chapterNumber',
    ParseIntPipe,
  )
  chapterNumber: number,
) {
  return this.content
    .getChapter(
      novelId,
      chapterNumber,
    );
}
}