import {
Body,
Controller,
Delete,
Get,
Param,
ParseIntPipe,
Patch,
Post,
Query,
Req,
UseGuards,
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


return this.chapterService.create(dto);


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
await this.authorization.assertChapterOwner(
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
await this.authorization.assertChapterOwner(
id,
request.user.id,
);


return this.chapterService.remove(id);


}

/*

* ==========================================
* Chapter retrieval
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
return this.chapterService.chapter(id);
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
await this.authorization.assertChapterOwner(
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
await this.authorization.assertChapterOwner(
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
* History
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
await this.authorization.assertChapterOwner(
id,
request.user.id,
);


return this.chapterHistoryService.history(
  id,
  request.user.id,
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
await this.authorization.assertChapterOwner(
id,
request.user.id,
);


return this.chapterHistoryService.latest(
  id,
  request.user.id,
);


}

@Post('history/restore')
@UseGuards(WritingAuthGuard)
async restoreVersion(
@Body()
dto: RestoreVersionDto,


@Req()
request: any,


) {
/*
* ChapterHistoryService is responsible for
* resolving the version and performing the
* restore.
*
* The current DTO contains the version id,
* so authorization must ultimately be checked
* against the chapter belonging to that version.
*
* Do not attempt to call getVersion() here unless
* that method actually exists in ChapterHistoryService.
*/
return this.chapterHistoryService.restore(
dto.versionId,
request.user.id,
);
}

@Delete('history/:id')
@UseGuards(WritingAuthGuard)
async deleteHistory(
@Param('id')
id: string,


@Req()
request: any,


) {
/*
* The history service currently owns the
* history-record operation.
*
* Authentication is required here. Ownership
* should be enforced inside ChapterHistoryService
* once the history record's chapter relationship
* is resolved there.
*/
return this.chapterHistoryService.delete(id, request.user.id);
}

/*

* ==========================================
* Chapter Ordering
* ==========================================
  */

@Post(':id/reorder')
@UseGuards(WritingAuthGuard)
async reorderChapter(
@Param('id')
chapterId: string,


@Body()
body: {
  novelId: string;
  position: number;
},

@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


await this.authorization.assertNovelOwner(
  body.novelId,
  request.user.id,
);

return this.chapterOrderService.reorder(
  body.novelId,
  chapterId,
  body.position,
);


}

@Post(':id/move-up')
@UseGuards(WritingAuthGuard)
async moveChapterUp(
@Param('id')
chapterId: string,


@Body()
body: {
  novelId: string;
},

@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


await this.authorization.assertNovelOwner(
  body.novelId,
  request.user.id,
);

return this.chapterOrderService.moveUp(
  body.novelId,
  chapterId,
);


}

@Post(':id/move-down')
@UseGuards(WritingAuthGuard)
async moveChapterDown(
@Param('id')
chapterId: string,


@Body()
body: {
  novelId: string;
},

@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


await this.authorization.assertNovelOwner(
  body.novelId,
  request.user.id,
);

return this.chapterOrderService.moveDown(
  body.novelId,
  chapterId,
);


}

/*

* ==========================================
* Chapter Locking
* ==========================================
  */

@Post(':id/lock')
@UseGuards(WritingAuthGuard)
async lockChapter(
@Param('id')
chapterId: string,


@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


return this.chapterLockService.acquire(
  chapterId,
  request.user.id,
);


}

@Post(':id/unlock')
@UseGuards(WritingAuthGuard)
async unlockChapter(
@Param('id')
chapterId: string,


@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


return this.chapterLockService.release(
  chapterId,
  request.user.id,
);


}

@Get(':id/lock')
@UseGuards(WritingAuthGuard)
async getLockStatus(
@Param('id')
chapterId: string,


@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


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
@UseGuards(WritingAuthGuard)
async publishChapter(
@Param('id')
chapterId: string,


@Body()
body: {
  novelId?: string;
},

@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


if (body?.novelId) {
  await this.authorization.assertNovelOwner(
    body.novelId,
    request.user.id,
  );
}

return this.chapterPublishService.publish(
  chapterId,
  body?.novelId,
);


}

@Post(':id/unpublish')
@UseGuards(WritingAuthGuard)
async unpublishChapter(
@Param('id')
chapterId: string,


@Body()
body: {
  novelId?: string;
},

@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


if (body?.novelId) {
  await this.authorization.assertNovelOwner(
    body.novelId,
    request.user.id,
  );
}

return this.chapterPublishService.unpublish(
  chapterId,
  body?.novelId,
);


}

@Get(':id/publish-status')
@UseGuards(WritingAuthGuard)
async getPublishStatus(
@Param('id')
chapterId: string,


@Req()
request: any,


) {
await this.authorization.assertChapterOwner(
chapterId,
request.user.id,
);


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
@UseGuards(WritingAuthGuard)
async searchChapters(
@Param('novelId')
novelId: string,


@Query('q')
query: string,

@Query('limit')
limit: string | undefined,

@Req()
request: any,


) {
await this.authorization.assertNovelOwner(
novelId,
request.user.id,
);


const parsedLimit = limit
  ? Number.parseInt(limit, 10)
  : 20;

return this.chapterSearchService.search(
  novelId,
  query ?? '',
  Number.isFinite(parsedLimit)
    ? Math.min(Math.max(parsedLimit, 1), 100)
    : 20,
);


}
}
