import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

@Injectable()
export class ChapterPublishingService {
  constructor(
    private readonly database:
      SupabaseService,
  ) {}

  async publishChapter(
    chapterId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: chapter,
      error: findError,
    } = await supabase
      .from('chapters')
      .select(
        'id, novel_id, title, chapter_number, is_published',
      )
      .eq(
        'id',
        chapterId,
      )
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found',
      );
    }

    if (chapter.is_published) {
      return chapter;
    }

    const {
      data,
      error,
    } = await supabase
      .from('chapters')
      .update({
        is_published: true,
        published_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
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

    return data;
  }

  async unpublishChapter(
    chapterId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .update({
        is_published: false,
        published_at: null,
        updated_at:
          new Date().toISOString(),
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
        'Chapter not found',
      );
    }

    return data;
  }

  async publishAll(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .update({
        is_published: true,
        published_at:
          new Date().toISOString(),
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'novel_id',
        novelId,
      )
      .eq(
        'is_published',
        false,
      )
      .select();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async unpublishAll(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .update({
        is_published: false,
        published_at: null,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        'novel_id',
        novelId,
      )
      .eq(
        'is_published',
        true,
      )
      .select();

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  async getPublishingStatus(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select(
        'id, title, chapter_number, is_published, published_at',
      )
      .eq(
        'novel_id',
        novelId,
      )
      .order(
        'chapter_number',
        {
          ascending: true,
        },
      );

    if (error) {
      throw error;
    }

    const chapters =
      data ?? [];

    return {
      total:
        chapters.length,

      published:
        chapters.filter(
          (chapter) =>
            chapter.is_published,
        ).length,

      unpublished:
        chapters.filter(
          (chapter) =>
            !chapter.is_published,
        ).length,

      chapters,
    };
  }
}