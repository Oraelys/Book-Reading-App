import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';
import { NovelsService } from '../../novels/novels.service';

@Injectable()
export class ChapterService {
  constructor(
    private readonly database: SupabaseService,
    private readonly novelsService: NovelsService,
  ) {}

  async create(
    dto: Record<string, unknown>,
  ) {
    const novelId = dto.novel_id;

    if (typeof novelId !== 'string') {
      throw new BadRequestException(
        'novel_id is required.',
      );
    }

    const supabase =
      this.database.getClient();

    const {
      data: lastChapter,
      error: lastChapterError,
    } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('novel_id', novelId)
      .order('chapter_number', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (lastChapterError) {
      throw lastChapterError;
    }

    const chapterNumber =
      lastChapter?.chapter_number
        ? lastChapter.chapter_number + 1
        : 1;

    const {
      data,
      error,
    } = await supabase
      .from('chapters')
      .insert({
        ...dto,
        novel_id: novelId,
        title:
          typeof dto.title === 'string' &&
          dto.title.trim()
            ? dto.title
            : `Chapter ${chapterNumber}`,
        chapter_number:
          chapterNumber,
        status:
          dto.status ?? 'draft',
        content:
          typeof dto.content === 'string'
            ? dto.content
            : '',
        word_count:
          typeof dto.content === 'string'
            ? this.countWords(dto.content)
            : 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    await this.novelsService.incrementChapterCount(
      novelId,
    );

    await supabase
      .from('admin_events')
      .insert({
        event_type:
          'chapter_created',
        title:
          'Chapter Created',
        message:
          `Created "${data.title}"`,
        novel_id:
          novelId,
        chapter_id:
          data.id,
      });

    return data;
  }

  async update(
    id: string,
    dto: Record<string, unknown>,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: existing,
      error: existingError,
    } = await supabase
      .from('chapters')
      .select(
        'novel_id, word_count',
      )
      .eq('id', id)
      .single();

    if (existingError) {
      throw existingError;
    }

    if (!existing) {
      throw new NotFoundException(
        `Chapter ${id} not found.`,
      );
    }

    const oldWordCount =
      existing.word_count ?? 0;

    const content =
      typeof dto.content === 'string'
        ? dto.content
        : undefined;

    const newWordCount =
      content !== undefined
        ? this.countWords(content)
        : oldWordCount;

    const updateData: Record<
      string,
      unknown
    > = {
      ...dto,
      updated_at:
        new Date().toISOString(),
      last_saved_at:
        new Date().toISOString(),
    };

    if (content !== undefined) {
      updateData.word_count =
        newWordCount;
    }

    const {
      data,
      error,
    } = await supabase
      .from('chapters')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        `Chapter ${id} not found.`,
      );
    }

    const difference =
      newWordCount - oldWordCount;

    if (difference !== 0) {
      await this.novelsService.updateWordCount(
        existing.novel_id,
        difference,
      );
    }

    return data;
  }

  async remove(
    id: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: chapter,
      error,
    } = await supabase
      .from('chapters')
      .select(
        'novel_id,title,word_count,status',
      )
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        `Chapter ${id} not found.`,
      );
    }

    const {
      error: deleteError,
    } = await supabase
      .from('chapters')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    await this.novelsService
      .decrementChapterCount(
        chapter.novel_id,
      );

    if (
      (chapter.word_count ?? 0) > 0
    ) {
      await this.novelsService
        .updateWordCount(
          chapter.novel_id,
          -chapter.word_count,
        );
    }

    if (
      chapter.status === 'published'
    ) {
      await this.novelsService
        .decrementPublishedCount(
          chapter.novel_id,
        );
    }

    await supabase
      .from('admin_events')
      .insert({
        event_type:
          'chapter_deleted',
        title:
          'Chapter Deleted',
        message:
          `Deleted "${chapter.title}"`,
        novel_id:
          chapter.novel_id,
        chapter_id:
          id,
      });

    return {
      success: true,
      id,
    };
  }

  async chapter(
  id: string,
) {
  const {
    data,
    error,
  } = await this.database
    .getClient()
    .from('chapters')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new NotFoundException(
      `Chapter ${id} not found.`,
    );
  }

  return data;
}

  async chapters(
  novelId: string,
) {
  const {
    data,
    error,
  } = await this.database
    .getClient()
    .from('chapters')
    .select('*')
    .eq('novel_id', novelId)
    .eq('is_published', true)
    .order(
      'chapter_number',
      {
        ascending: true,
      },
    );

  if (error) {
    throw error;
  }

  return data ?? [];
}

  private countWords(
    content: string,
  ): number {
    const trimmed =
      content.trim();

    if (!trimmed) {
      return 0;
    }

    return trimmed.split(/\s+/).length;
  }
}