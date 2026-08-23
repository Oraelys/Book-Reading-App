import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { ChapterService } from '../services/chapter.service';
import { DraftService } from '../services/draft.service';

import {
  ChapterAutosaveService,
} from '../providers/chapter-autosave.service';

import {
  ChapterHistoryService,
} from '../providers/chapter-history.service';

import {
  ChapterOrderService,
} from '../providers/chapter-order.service';

import {
  ChapterLockService,
} from '../providers/chapter-lock.service';

import {
  ChapterPublishService,
} from '../providers/chapter-publish.service';

import {
  ChapterSearchService,
} from '../providers/chapter-search.service';

import {
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  WritingAuthGuard,
} from '../guards/writing-auth.guard';

import {
  WritingAuthorizationService,
} from '../services/writing-authorization.service';

import { SaveDraftDto } from '../dto/save-draft.dto';
import { AutosaveDto } from '../dto/autosave.dto';
import { RestoreVersionDto } from '../dto/restore-version.dto';

@Controller('chapters')
export class ChapterController {
  constructor(
    private readonly chapterService:
      ChapterService,

    private readonly draftService:
      DraftService,

    private readonly autosaveService:
      ChapterAutosaveService,

    private readonly chapterHistoryService:
      ChapterHistoryService,

    private readonly chapterOrderService:
      ChapterOrderService,

    private readonly chapterLockService:
      ChapterLockService,

    private readonly chapterPublishService:
      ChapterPublishService,

    private readonly chapterSearchService:
      ChapterSearchService,

      private readonly authorization:
  WritingAuthorizationService,
  ) {}

  /*
   * ==========================================
   * Chapter CRUD
   * ==========================================
   */

 @Post()
@UseGuards(WritingAuthGuard)
async createChapter(
  @Body()
  dto: any,

  @Req()
  request: any,
) {
  await this.authorization.assertNovelOwner(
    dto.novel_id,
    request.user.id,
  );

  return this.chapterService.create(
    dto,
  );
}

@Patch(':id')
@UseGuards(WritingAuthGuard)
async updateChapter(
  @Param('id')
  id: string,

  @Body()
  dto: any,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.chapterService.update(
    id,
    dto,
  );
}

@Delete(':id')
@UseGuards(WritingAuthGuard)
async deleteChapter(
  @Param('id')
  id: string,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.chapterService.remove(
    id,
  );
}

  /*
   * ==========================================
   * Chapter lists / retrieval
   * ==========================================
   */

  @Get('story/:storyId')
  getStoryChapters(
    @Param('storyId')
    storyId: string,
  ) {
    return this.chapterService.chapters(
      storyId,
    );
  }

  @Get(':id')
  getChapter(
    @Param('id')
    id: string,
  ) {
    return this.chapterService.chapter(
      id,
    );
  }

  /*
   * ==========================================
   * Drafts
   * ==========================================
   */

@Post(':id/save')
@UseGuards(WritingAuthGuard)
async saveDraft(
  @Param('id')
  id: string,

  @Body()
  dto: SaveDraftDto,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.draftService.save(
    id,
    dto.content,
  );
}

@Post(':id/autosave')
@UseGuards(WritingAuthGuard)
async autosaveChapter(
  @Param('id')
  id: string,

  @Body()
  dto: AutosaveDto,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.autosaveService.autosave(
    id,
    dto.content,
  );
}

  /*
   * ==========================================
   * Chapter history
   * ==========================================
   */

@Get(':id/history')
@UseGuards(WritingAuthGuard)
async getHistory(
  @Param('id')
  id: string,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.chapterHistoryService.history(
    id,
  );
}

@Get(':id/history/latest')
@UseGuards(WritingAuthGuard)
async getLatestHistory(
  @Param('id')
  id: string,

  @Req()
  request: any,
) {
  await this.authorization
    .assertChapterOwner(
      id,
      request.user.id,
    );

  return this.chapterHistoryService.latest(
    id,
  );
}

  @Post('history/restore')
  restoreVersion(
    @Body()
    dto: RestoreVersionDto,
  ) {
    return this.chapterHistoryService.restore(
      dto.versionId,
    );
  }

  @Delete('history/:id')
  deleteHistory(
    @Param('id')
    id: string,
  ) {
    return this.chapterHistoryService.delete(
      id,
    );
  }

  /*
   * ==========================================
   * Chapter ordering
   * ==========================================
   */

  @Post(':id/reorder')
  reorderChapter(
    @Param('id')
    chapterId: string,

    @Body()
    body: {
      novelId: string;
      position: number;
    },
  ) {
    return this.chapterOrderService.reorder(
      body.novelId,
      chapterId,
      body.position,
    );
  }

  @Post(':id/move-up')
  moveChapterUp(
    @Param('id')
    chapterId: string,

    @Body()
    body: {
      novelId: string;
    },
  ) {
    return this.chapterOrderService.moveUp(
      body.novelId,
      chapterId,
    );
  }

  @Post(':id/move-down')
  moveChapterDown(
    @Param('id')
    chapterId: string,

    @Body()
    body: {
      novelId: string;
    },
  ) {
    return this.chapterOrderService.moveDown(
      body.novelId,
      chapterId,
    );
  }

  /*
   * ==========================================
   * Chapter locking
   * ==========================================
   */

  @Post(':id/lock')
  lockChapter(
    @Param('id')
    chapterId: string,

    @Body()
    body: {
      userId: string;
    },
  ) {
    return this.chapterLockService.acquire(
      chapterId,
      body.userId,
    );
  }

  @Post(':id/unlock')
  unlockChapter(
    @Param('id')
    chapterId: string,

    @Body()
    body: {
      userId: string;
    },
  ) {
    return this.chapterLockService.release(
      chapterId,
      body.userId,
    );
  }

  @Get(':id/lock')
  getLockStatus(
    @Param('id')
    chapterId: string,
  ) {
    return this.chapterLockService.status(
      chapterId,
    );
  }

  /*
   * ==========================================
   * Publishing
   * ==========================================
   */

  @Post(':id/publish')
  publishChapter(
    @Param('id')
    chapterId: string,

    @Body()
    body?: {
      novelId?: string;
    },
  ) {
    return this.chapterPublishService.publish(
      chapterId,
      body?.novelId,
    );
  }

  @Post(':id/unpublish')
  unpublishChapter(
    @Param('id')
    chapterId: string,

    @Body()
    body?: {
      novelId?: string;
    },
  ) {
    return this.chapterPublishService.unpublish(
      chapterId,
      body?.novelId,
    );
  }

  @Get(':id/publish-status')
  getPublishStatus(
    @Param('id')
    chapterId: string,
  ) {
    return this.chapterPublishService.status(
      chapterId,
    );
  }

  /*
   * ==========================================
   * Search
   * ==========================================
   */

  @Get('search/:novelId')
  searchChapters(
    @Param('novelId')
    novelId: string,

    @Query('q')
    query: string,

    @Query('limit')
    limit?: string,
  ) {
    const parsedLimit =
      limit
        ? Number.parseInt(limit, 10)
        : 20;

    return this.chapterSearchService.search(
      novelId,
      query ?? '',
      Number.isFinite(parsedLimit)
        ? parsedLimit
        : 20,
    );
  }
}