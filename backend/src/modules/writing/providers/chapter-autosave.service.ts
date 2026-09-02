import {
  Injectable,
} from '@nestjs/common';

import { DraftService } from '../services/draft.service';

@Injectable()
export class ChapterAutosaveService {
  constructor(
    private readonly draftService:
      DraftService,
  ) {}

  async autosave(
    chapterId: string,
    content: string,
  ) {
    /*
     * chapterId refers to the chapters table,
     * not story_drafts.
     *
     * Ownership is already enforced by
     * ChapterController before this method runs.
     */
    const saved =
      await this.draftService.save(
        chapterId,
        content,
      );

    return {
      success: true,

      chapterId,

      savedAt:
        new Date().toISOString(),

      chapter: saved,
    };
  }
}