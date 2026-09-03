
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class NovelsService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /**
   * Internal novel creation method.
   *
   * Author-facing creation should go through
   * WritingService rather than this API.
   */
  async create(data: any) {
    const { data: novel, error } =
      await this.database
        .getClient()
        .from('novels')
        .insert(data)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return novel;
  }

  /**
   * Public/read-only novel listing.
   *
   * Draft and private novels must never be exposed
   * through the public /novels endpoint.
   */
  async findAll() {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /**
   * Public/read-only novel retrieval.
   *
   * Only published novels are available through
   * the public /novels/:id endpoint.
   */
  async findOne(id: string) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

    if (error || !data) {
      throw new NotFoundException(
        'Novel not found.',
      );
    }

    return data;
  }

  /**
   * Internal update method.
   *
   * This is intentionally not exposed through
   * NovelsController. Author updates belong to
   * WritingService + WritingAuthorizationService.
   */
  async update(
    id: string,
    dto: any,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .update({
          ...dto,
          updated_at: new Date(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Internal deletion method.
   *
   * This is intentionally not exposed through
   * NovelsController.
   */
  async delete(id: string) {
    await this.database
      .getClient()
      .from('novels')
      .delete()
      .eq('id', id);

    return {
      success: true,
    };
  }

  async incrementChapterCount(
    novelId: string,
  ) {
    const { error } =
      await this.database
        .getClient()
        .rpc('increment_chapter_count', {
          novel_uuid: novelId,
        });

    if (error) {
      throw error;
    }
  }

  async decrementChapterCount(
    novelId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .select('total_chapters')
      .eq('id', novelId)
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('novels')
      .update({
        total_chapters: Math.max(
          (novel.total_chapters ?? 1) - 1,
          0,
        ),
        updated_at: new Date(),
      })
      .eq('id', novelId);
  }

  async incrementPublishedCount(
    novelId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .select('published_chapters')
      .eq('id', novelId)
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('novels')
      .update({
        published_chapters:
          (novel.published_chapters ?? 0) + 1,
        updated_at: new Date(),
      })
      .eq('id', novelId);
  }

  async decrementPublishedCount(
    novelId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .select('published_chapters')
      .eq('id', novelId)
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('novels')
      .update({
        published_chapters: Math.max(
          (novel.published_chapters ?? 1) - 1,
          0,
        ),
        updated_at: new Date(),
      })
      .eq('id', novelId);
  }

  async updateWordCount(
    novelId: string,
    difference: number,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .select('word_count')
      .eq('id', novelId)
      .single();

    if (error) {
      throw error;
    }

    await supabase
      .from('novels')
      .update({
        word_count: Math.max(
          (novel.word_count ?? 0) +
            difference,
          0,
        ),
        updated_at: new Date(),
      })
      .eq('id', novelId);
  }
}

