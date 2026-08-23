import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { NovelsService } from '../novels/novels.service';

@Injectable()
export class PublishingService {
  constructor(
    private readonly database: SupabaseService,
    private readonly novelsService: NovelsService,
  ) {}

  /**
   * Validate a story before publication.
   */
  async validateStory(novelId: string) {
    const supabase = this.database.getClient();

    const { data: novel, error: novelError } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .single();

    if (novelError || !novel) {
      throw new NotFoundException('Story not found.');
    }

    const { data: chapters, error: chapterError } = await supabase
      .from('chapters')
      .select('*')
      .eq('novel_id', novelId)
      .order('chapter_number');

    if (chapterError) {
      throw chapterError;
    }

    const errors: { field: string; message: string }[] = [];

    // ---------- Story ----------
    if (!novel.title?.trim()) {
      errors.push({
        field: 'title',
        message: 'Story title is required.',
      });
    }

    if (!novel.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Story description is required.',
      });
    }

    if (!novel.cover_image_url) {
      errors.push({
        field: 'cover',
        message: 'Cover image is required.',
      });
    }

    if (!novel.author_name?.trim()) {
      errors.push({
        field: 'author_name',
        message: 'Author name is required.',
      });
    }

    if (!novel.category?.trim()) {
      errors.push({
        field: 'category',
        message: 'Category is required.',
      });
    }

    // ---------- Chapters ----------
    if (!chapters || chapters.length === 0) {
      errors.push({
        field: 'chapters',
        message: 'At least one chapter must exist.',
      });
    } else {
      const published = chapters.filter(
        (chapter) => chapter.status === 'published',
      );

      if (published.length === 0) {
        errors.push({
          field: 'published',
          message: 'Publish at least one chapter.',
        });
      }

      // Duplicate chapter numbers
      const numbers = chapters.map((c) => c.chapter_number);
      const duplicates = numbers.filter(
        (item, index) => numbers.indexOf(item) !== index,
      );

      if (duplicates.length > 0) {
        errors.push({
          field: 'chapter_number',
          message: 'Duplicate chapter numbers detected.',
        });
      }

      // Empty published chapters
      published.forEach((chapter) => {
        if (!chapter.content?.trim()) {
          errors.push({
            field: `chapter_${chapter.chapter_number}`,
            message: `Published Chapter ${chapter.chapter_number} has no content.`,
          });
        }
      });
    }

    return {
      canPublish: errors.length === 0,
      errors,
    };
  }

  /**
   * Publish an entire story.
   */
  async publishStory(novelId: string) {
    const validation = await this.validateStory(novelId);

    if (!validation.canPublish) {
      throw new BadRequestException(validation);
    }

    const supabase = this.database.getClient();

    const { data: novel, error } = await supabase
      .from('novels')
      .update({
        status: 'published',
        is_public: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', novelId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await this.logAdminEvent(
      'story_published',
      'Story Published',
      `"${novel.title}" was published.`,
    );

    await this.createBackgroundJob(
      'SEARCH_REINDEX',
      novelId,
    );

    await this.createBackgroundJob(
      'RECOMMENDATION_REFRESH',
      novelId,
    );

    await this.createBackgroundJob(
      'TRENDING_REFRESH',
      novelId,
    );

    return {
      success: true,
      message: 'Story published successfully.',
      novel,
    };
  }

  /**
   * Unpublish story.
   */
  async unpublishStory(novelId: string) {
    const supabase = this.database.getClient();

    const { data: novel, error } = await supabase
      .from('novels')
      .update({
        status: 'draft',
        is_public: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', novelId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    await this.logAdminEvent(
      'story_unpublished',
      'Story Unpublished',
      `"${novel.title}" was unpublished.`,
    );

    return {
      success: true,
      message: 'Story unpublished.',
      novel,
    };
  }

  // Chapter publishing and unpublishing methods can be added here, similar to the story methods above.

  async validateChapter(chapterId: string) {
  const supabase = this.database.getClient();

  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .single();

  if (error || !chapter) {
    throw new NotFoundException('Chapter not found.');
  }

  const errors: { field: string; message: string }[] = [];

  if (!chapter.title?.trim()) {
    errors.push({
      field: 'title',
      message: 'Chapter title is required.',
    });
  }

  if (!chapter.content?.trim()) {
    errors.push({
      field: 'content',
      message: 'Chapter content is empty.',
    });
  }

  if ((chapter.word_count ?? 0) < 50) {
    errors.push({
      field: 'word_count',
      message: 'Chapter is too short.',
    });
  }

  return {
    canPublish: errors.length === 0,
    errors,
    chapter,
  };
}

async publishChapter(chapterId: string) {

  const validation =
    await this.validateChapter(chapterId);

  if (!validation.canPublish) {
    throw new BadRequestException(validation);
  }

  const supabase = this.database.getClient();

  const { data: chapter, error } =
    await supabase
      .from('chapters')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', chapterId)
      .select()
      .single();

  if (error) throw error;

  await this.updateNovelStatistics(
    chapter.novel_id,
  );

  await this.logAdminEvent(
    'chapter_published',
    'Chapter Published',
    `"${chapter.title}" published.`,
  );

  await this.createBackgroundJob(
    'SEARCH_REINDEX',
    chapter.novel_id,
  );

  return {
    success: true,
    chapter,
  };
}

async unpublishChapter(
  chapterId: string,
) {

  const supabase =
    this.database.getClient();

  const { data: chapter, error } =
    await supabase
      .from('chapters')
      .update({
        status: 'draft',
        unpublished_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', chapterId)
      .select()
      .single();

  if (error) throw error;

  await this.updateNovelStatistics(
    chapter.novel_id,
  );

  await this.logAdminEvent(
    'chapter_unpublished',
    'Chapter Unpublished',
    `"${chapter.title}" unpublished.`,
  );

  return {
    success: true,
    chapter,
  };
}

private async updateNovelStatistics(
  novelId: string,
) {

  const supabase =
    this.database.getClient();

  const { data: chapters } =
    await supabase
      .from('chapters')
      .select(
        'status, word_count, estimated_read_time',
      )
      .eq('novel_id', novelId);

  const published =
    chapters?.filter(
      c => c.status === 'published',
    ) ?? [];

  const draft =
    chapters?.filter(
      c => c.status === 'draft',
    ) ?? [];

  const totalWords =
    chapters?.reduce(
      (sum, c) =>
        sum + (c.word_count ?? 0),
      0,
    ) ?? 0;

  const readingTime =
    chapters?.reduce(
      (sum, c) =>
        sum +
        (c.estimated_read_time ?? 0),
      0,
    ) ?? 0;

  await supabase
    .from('novels')
    .update({
      published_chapters:
        published.length,

      draft_chapters:
        draft.length,

      total_words:
        totalWords,

      reading_time:
        readingTime,

      updated_at:
        new Date().toISOString(),
    })
    .eq('id', novelId);
}

  /**
   * Create background jobs.
   */
  private async createBackgroundJob(
    jobType: string,
    novelId: string,
  ) {
    const supabase = this.database.getClient();

    await supabase.from('background_jobs').insert({
      job_type: jobType,
      novel_id: novelId,
      status: 'pending',
      progress: 0,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Log admin events.
   */
  private async logAdminEvent(
    eventType: string,
    title: string,
    message: string,
  ) {
    const supabase = this.database.getClient();

    await supabase.from('admin_events').insert({
      event_type: eventType,
      title,
      message,
      created_at: new Date().toISOString(),
    });
  }

  
}