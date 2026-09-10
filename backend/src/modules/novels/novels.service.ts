import {
  Injectable,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../database/supabase.service';

@Injectable()
export class NovelsService {
  constructor(
    private readonly database:
      SupabaseService,
  ) {}

  /**
   * Internal novel creation method.
   *
   * Author-facing creation should go through
   * WritingService rather than this API.
   */
  async create(data: any) {
    const {
      data: novel,
      error,
    } = await this.database
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
   * Create a novel introduced by an administrator.
   *
   * The administrator is NOT stored as the novel owner.
   *
   * Ownership remains separate from import administration.
   */
  async createImportedNovel(
    data: {
      title: string;
      description?: string | null;
      category?: string | null;
      authorName: string;
    },
  ) {
    const {
      data: novel,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .insert({
        title: data.title,
        description:
          data.description ?? null,
        category:
          data.category ?? null,

        /*
         * An imported novel does not belong
         * to the administrator.
         */
        created_by: null,

        /*
         * Keep imported content separate
         * from author-created stories.
         */
        content_origin:
          'admin_imported',

        /*
         * Imported books begin unpublished.
         */
        status: 'draft',
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return novel;
  }

  /**
   * Public/read-only listing.
   *
   * Only published novels are exposed.
   */
  async findPublished() {
    const {
      data,
      error,
    } = await this.database
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
   * Public/read-only retrieval.
   *
   * Only published novels are exposed.
   */
  async findPublishedOne(
    id: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      throw new Error(
        'Novel not found.',
      );
    }

    return data;
  }

  /**
   * Internal novel lookup.
   *
   * This intentionally includes draft novels.
   */
  async findOne(
    id: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new Error(
        'Novel not found.',
      );
    }

    return data;
  }

  /**
   * Internal update method.
   */
  async update(
    id: string,
    dto: any,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .update({
        ...dto,
        updated_at:
          new Date(),
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
   */
  async delete(
    id: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  }

  /**
   * Atomically increment total chapter count.
   */
  async incrementChapterCount(
    novelId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .rpc(
        'increment_chapter_count',
        {
          novel_uuid: novelId,
        },
      );

    if (error) {
      throw error;
    }
  }

  /**
   * Atomically decrement total chapter count.
   */
  async decrementChapterCount(
    novelId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .rpc(
        'decrement_chapter_count',
        {
          novel_uuid: novelId,
        },
      );

    if (error) {
      throw error;
    }
  }

  /**
   * Atomically increment published chapter count.
   */
  async incrementPublishedCount(
    novelId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .rpc(
        'increment_published_count',
        {
          novel_uuid: novelId,
        },
      );

    if (error) {
      throw error;
    }
  }

  /**
   * Atomically decrement published chapter count.
   */
  async decrementPublishedCount(
    novelId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .rpc(
        'decrement_published_count',
        {
          novel_uuid: novelId,
        },
      );

    if (error) {
      throw error;
    }
  }

  /**
   * Atomically adjust the novel's aggregate word count.
   */
  async updateWordCount(
    novelId: string,
    difference: number,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .rpc(
        'update_novel_word_count',
        {
          novel_uuid: novelId,
          word_difference:
            difference,
        },
      );

    if (error) {
      throw error;
    }
  }
}