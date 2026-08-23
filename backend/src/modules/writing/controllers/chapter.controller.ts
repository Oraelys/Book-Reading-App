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

import {
  ChapterService,
} from '../services/chapter.service';

import {
  DraftService,
} from '../services/draft.service';

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
  SaveDraftDto,
} from '../dto/save-draft.dto';

import {
  AutosaveDto,
} from '../dto/autosave.dto';

import {
  RestoreVersionDto,
} from '../dto/restore-version.dto';

import {
  ReorderChapterDto,
} from '../dto/reorder-chapter.dto';

import {
  ChapterPublishService,
} from '../providers/chapter-publish.service';

import {
  ChapterSearchService,
} from '../providers/chapter-search.service';

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
  ) {}

  /*
   * ==========================================
   * Chapter CRUD
   * ==========================================
   */

  @Post()
  createChapter(
    @Body()
    dto: any,
  ) {
    return this.chapterService.create(
      dto,
    );
  }

  @Patch(':id')
  updateChapter(
    @Param('id')
    id: string,

    @Body()
    dto: any,
  ) {
    return this.chapterService.update(
      id,
      dto,
    );
  }

  @Delete(':id')
  deleteChapter(
    @Param('id')
    id: string,
  ) {
    return this.chapterService.remove(
      id,
    );
  }

  /*
   * Keep this route after the more
   * specific chapter routes.
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
  saveDraft(
    @Param('id')
    id: string,

    @Body()
    dto: SaveDraftDto,
  ) {
    return this.draftService.save(
      id,
      dto.content,
    );
  }

  @Post(':id/autosave')
  autosaveChapter(
    @Param('id')
    id: string,

    @Body()
    dto: AutosaveDto,
  ) {
    return this.autosaveService.autosave(
      id,
      dto.content,
    );
  }

  /*
   * ==========================================
   * History
   * ==========================================
   */

  @Get(':id/history/latest')
  getLatestHistory(
    @Param('id')
    id: string,
  ) {
    return this.chapterHistoryService.latest(
      id,
    );
  }

  @Get(':id/history')
  getHistory(
    @Param('id')
    id: string,
  ) {
    return this.chapterHistoryService.history(
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
   * Chapter Ordering
   * ==========================================
   */

  @Post(':id/reorder')
  reorderChapter(
    @Param('id')
    chapterId: string,

    @Body()
    dto: ReorderChapterDto,
  ) {
    return this.chapterOrderService.reorder(
      dto.novelId,
      chapterId,
      dto.position,
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
   * Chapter Editing Lock
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

  @Delete(':id/lock')
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
  getChapterLock(
    @Param('id')
    chapterId: string,
  ) {
    return this.chapterLockService.status(
      chapterId,
    );
  }


  /*
   * ==========================================
   * Chapter Publishing
   * ==========================================
   */

  /*
 * ==========================================
 * Chapter Publishing
 * ==========================================
 */

@Post(':id/publish')
publishChapter(
  @Param('id')
  chapterId: string,
) {
  return this.chapterPublishService.publish(
    chapterId,
  );
}

@Post(':id/unpublish')
unpublishChapter(
  @Param('id')
  chapterId: string,
) {
  return this.chapterPublishService.unpublish(
    chapterId,
  );
}

@Get(':id/publish/status')
getPublishStatus(
  @Param('id')
  chapterId: string,
) {
  return this.chapterPublishService.status(
    chapterId,
  );
}


@Get('story/:storyId/search')
searchChapters(
  @Param('storyId')
  storyId: string,

  @Query('q')
  query = '',

  @Query('limit')
  limit = '20',
) {
  return this.chapterSearchService.search(
    storyId,
    query,
    Number(limit),
  );
}
} 