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

  /**
   * The database uses novels.created_by as the
   * canonical owner of a story.
   *
   * The authenticated Supabase user's id must
   * match this value.
   */
  async assertNovelOwner(
    novelId: string,
    userId: string,
  ) {
    const {
      data: novel,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('id, created_by')
      .eq('id', novelId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!novel) {
      throw new NotFoundException(
        'Novel not found.',
      );
    }

    if (novel.created_by !== userId) {
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
    } = await this.database
      .getClient()
      .from('chapters')
      .select('id, novel_id')
      .eq('id', chapterId)
      .maybeSingle();

    if (chapterError) {
      throw chapterError;
    }

    if (!chapter) {
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

  async assertChapterOwnerAndGetChapter(
    chapterId: string,
    userId: string,
  ) {
    const {
      data: chapter,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
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

  async assertDraftOwner(
    draftId: string,
    userId: string,
  ) {
    const {
      data: draft,
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .select('id, novel_id')
      .eq('id', draftId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!draft) {
      throw new NotFoundException(
        'Draft not found.',
      );
    }

    await this.assertNovelOwner(
      draft.novel_id,
      userId,
    );

    return draft;
  }

  async assertProcessingJobOwner(
    jobId: string,
    userId: string,
  ) {
    const {
      data: job,
      error,
    } = await this.database
      .getClient()
      .from('processing_jobs')
      .select('id, book_id')
      .eq('id', jobId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!job) {
      throw new NotFoundException(
        'Processing job not found.',
      );
    }

    await this.assertNovelOwner(
      job.book_id,
      userId,
    );

    return job;
  }
}