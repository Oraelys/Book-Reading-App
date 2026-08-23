import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class WritingAuthorizationService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async assertNovelOwner(
    novelId: string,
    userId: string,
  ) {
    const {
      data: novel,
      error,
    } =
      await this.database
        .getClient()
        .from('novels')
        .select(
          'id, created_by',
        )
        .eq(
          'id',
          novelId,
        )
        .single();

    if (
      error ||
      !novel
    ) {
      throw new NotFoundException(
        'Novel not found.',
      );
    }

    if (
      novel.created_by !== userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to modify this novel.',
      );
    }

    return novel;
  }

  async assertChapterOwner(
    chapterId: string,
    userId: string,
  ) {
    const {
      data: chapter,
      error: chapterError,
    } =
      await this.database
        .getClient()
        .from('chapters')
        .select(
          'id, novel_id',
        )
        .eq(
          'id',
          chapterId,
        )
        .single();

    if (
      chapterError ||
      !chapter
    ) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return this.assertNovelOwner(
      chapter.novel_id,
      userId,
    );
  }

  async assertChapterOwnerAndGetChapter(
    chapterId: string,
    userId: string,
  ) {
    const {
      data: chapter,
      error,
    } =
      await this.database
        .getClient()
        .from('chapters')
        .select('*')
        .eq(
          'id',
          chapterId,
        )
        .single();

    if (
      error ||
      !chapter
    ) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    await this.assertNovelOwner(
      chapter.novel_id,
      userId,
    );

    return chapter;
  }
}