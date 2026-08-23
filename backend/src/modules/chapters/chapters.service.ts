import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { NovelsService } from '../novels/novels.service';

import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Injectable()
export class ChaptersService {
  constructor(
    private readonly database: SupabaseService,
    private readonly novelsService: NovelsService,
  ) {}

  /*
   * Create Chapter
   */
  async create(dto: CreateChapterDto) {
    const supabase = this.database.getClient();

    const {
      data: lastChapter,
      error: lastChapterError,
    } = await supabase
      .from('chapters')
      .select('chapter_number')
      .eq('novel_id', dto.novelId)
      .order('chapter_number', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (lastChapterError) {
      throw lastChapterError;
    }

    const nextChapterNumber = lastChapter
      ? lastChapter.chapter_number + 1
      : 1;

    const { data, error } = await supabase
      .from('chapters')
      .insert({
        novel_id: dto.novelId,
        title:
          dto.title ??
          `Chapter ${nextChapterNumber}`,
        chapter_number: nextChapterNumber,
        status: 'draft',
        content: '',
        word_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    

  await this.novelsService.incrementChapterCount(dto.novelId);

    await supabase
      .from('admin_events')
      .insert({
        event_type: 'chapter_created',
        title: 'Chapter Created',
        message: `Created "${data.title}"`,
      });

    return data;
  }

  /*
   * Get One Chapter
   */
  async findOne(id: string) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * Get Chapters For Novel
   */
  async getNovelChapters(
    novelId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number');

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * Update Chapter (Autosave)
   */
  async update(
    id: string,
    dto: UpdateChapterDto,
  ) {
    const supabase =
      this.database.getClient();

    const {
  data: existing,
  error: existingError,
} = await supabase
  .from('chapters')
  .select('novel_id, word_count')
  .eq('id', id)
  .single();

    if (existingError) {
      throw existingError;
    }

   const oldWordCount = existing.word_count ?? 0;

const newWordCount =
  dto.content?.trim().length
    ? dto.content.trim().split(/\s+/).length
    : 0;

    const { data, error } =
      await supabase
        .from('chapters')
        .update({
          title: dto.title,
          content: dto.content,
          word_count: newWordCount,
          updated_at: new Date(),
          last_saved_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
      throw error;
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

  /*
   * Publish Chapter
   */
  async publish(id: string) {
    const supabase =
      this.database.getClient();

    const { data: existing, error } =
      await supabase
        .from('chapters')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
      throw error;
    }

    if (!existing.title?.trim()) {
      throw new BadRequestException(
        'Chapter title is required.',
      );
    }

    if (!existing.content?.trim()) {
      throw new BadRequestException(
        'Chapter content cannot be empty.',
      );
    }

    const wordCount =
      existing.content
        .trim()
        .split(/\s+/).length;

    if (wordCount < 50) {
      throw new BadRequestException(
        'Chapter must contain at least 50 words before publishing.',
      );
    }

    const {
      data,
      error: publishError,
    } = await supabase
      .from('chapters')
      .update({
        status: 'published',
        published_at: new Date(),
        word_count: wordCount,
      })
      .eq('id', id)
      .select()
      .single();

    if (publishError) {
      throw publishError;
    }

   await this.novelsService.incrementPublishedCount(data.novel_id);

    await supabase
      .from('admin_events')
      .insert({
        event_type:
          'chapter_published',
        title: 'Chapter Published',
        message: `Published "${data.title}"`,
      });

    return data;
  }

  /*
   * Unpublish Chapter
   */
  async unpublish(id: string) {
    const supabase =
      this.database.getClient();

    const { data, error } =
      await supabase
        .from('chapters')
        .update({
          status: 'draft',
          published_at: null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
      throw error;
    }

   await this.novelsService.decrementPublishedCount(data.novel_id);

    return data;
  }

  /*
   * Delete Chapter
   */
  async remove(id: string) {
    const supabase =
      this.database.getClient();

    const {
      data: chapter,
      error,
    } = await supabase
      .from('chapters')
      .select('novel_id,title,word_count,status')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
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

await this.novelsService.decrementChapterCount(
  chapter.novel_id,
);

if ((chapter.word_count ?? 0) > 0) {
  await this.novelsService.updateWordCount(
    chapter.novel_id,
    -(chapter.word_count ?? 0),
  );
}

if (chapter.status === 'published') {
  await this.novelsService.decrementPublishedCount(
    chapter.novel_id,
  );
}
    await supabase
      .from('admin_events')
      .insert({
        event_type:
          'chapter_deleted',
        title: 'Chapter Deleted',
        message: `Deleted "${chapter.title}"`,
      });

    return {
      success: true,
    };
  }
}