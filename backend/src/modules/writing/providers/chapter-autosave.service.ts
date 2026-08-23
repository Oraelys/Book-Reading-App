import {
  Injectable,
  NotFoundException,
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
    const chapter =
      await this.draftService.get(
        chapterId,
      );

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

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