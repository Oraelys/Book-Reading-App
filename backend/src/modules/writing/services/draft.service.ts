import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

import {
  ChapterMetricsService,
} from '../providers/chapter-metrics.service';

@Injectable()
export class DraftService {
  constructor(
    private readonly database:
      SupabaseService,

    private readonly metrics:
      ChapterMetricsService,
  ) {}

  async create(
    novelId: string,
    title?: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error: novelError,
    } = await supabase
      .from('novels')
      .select('id')
      .eq('id', novelId)
      .maybeSingle();

    if (novelError) {
      throw novelError;
    }

    if (!novel) {
      throw new NotFoundException(
        'Novel not found',
      );
    }

    const {
      data: existing,
      error: orderError,
    } = await supabase
      .from('story_drafts')
      .select(
        'chapter_order',
      )
      .eq(
        'novel_id',
        novelId,
      )
      .order(
        'chapter_order',
        {
          ascending: false,
        },
      )
      .limit(1);

    if (orderError) {
      throw orderError;
    }

    const nextOrder =
      existing &&
      existing.length > 0
        ? existing[0].chapter_order + 1
        : 1;

    const {
      data,
      error,
    } = await supabase
      .from('story_drafts')
      .insert({
        novel_id:
          novelId,

        title:
          title ||
          `Chapter ${nextOrder}`,

        content:
          '',

        chapter_order:
          nextOrder,

        word_count:
          0,

        status:
          'draft',

        created_at:
          new Date().toISOString(),

        updated_at:
          new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async get(
    draftId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .select('*')
      .eq(
        'id',
        draftId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Draft not found',
      );
    }

    return data;
  }

  async getNovelDrafts(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .select('*')
      .eq(
        'novel_id',
        novelId,
      )
      .order(
        'chapter_order',
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async save(
  chapterId: string,
  content: string,
) {
  const stats =
    this.metrics.calculate(
      content,
    );

  const now =
    new Date().toISOString();

  const {
    data,
    error,
  } = await this.database
    .getClient()
    .from('chapters')
    .update({
      content,

      word_count:
        stats.wordCount,

      estimated_read_time:
        stats.estimatedReadingMinutes,

      last_saved_at:
        now,

      updated_at:
        now,
    })
    .eq(
      'id',
      chapterId,
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundException(
      `Chapter ${chapterId} was not found.`,
    );
  }

  return {
    ...data,

    metrics: stats,

    savedAt: now,
  };
}

  async updateTitle(
    draftId: string,
    title: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .update({
        title,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        draftId,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Draft not found',
      );
    }

    return data;
  }

  async submit(
    draftId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .update({
        status:
          'submitted',

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'id',
        draftId,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Draft not found',
      );
    }

    return data;
  }

  async delete(
    draftId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .from('story_drafts')
      .delete()
      .eq(
        'id',
        draftId,
      );

    if (error) {
      throw error;
    }

    return {
      success: true,

      draftId,
    };
  }
}