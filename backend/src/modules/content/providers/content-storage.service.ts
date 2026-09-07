import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

@Injectable()
export class ContentStorageService {
  constructor(
    private readonly database:
      SupabaseService,
  ) {}

  /**
   * Save the result of the content-processing
   * pipeline into the chapters table.
   *
   * Chapter replacement and novel aggregate
   * counter synchronization are handled by a
   * single database transaction through the
   * replace_novel_chapters RPC.
   */
  async saveDocument(
    novelId: string,
    document: any,
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

    const chapters =
      Array.isArray(
        document?.chapters,
      )
        ? document.chapters
        : [];

    if (!chapters.length) {
      throw new Error(
        'No chapters were detected in the document.',
      );
    }

    /*
     * Prepare the processed chapters before
     * handing them to the atomic database
     * replacement operation.
     */
    const rows =
      chapters.map(
        (
          chapter: any,
          index: number,
        ) => {
          const content =
            chapter.content || '';

          return {
            title:
              chapter.title ||
              `Chapter ${index + 1}`,

            chapter_number:
              chapter.chapterNumber ??
              index + 1,

            content,

            word_count:
              chapter.wordCount ??
              this.countWords(
                content,
              ),

            estimated_read_time:
              chapter.estimatedReadingMinutes ??
              this.estimateReadingMinutes(
                content,
              ),
          };
        },
      );

    /*
     * Atomically:
     *
     * 1. Delete the previous chapter set.
     * 2. Insert the newly processed chapters.
     * 3. Recalculate total_chapters.
     * 4. Recalculate published_chapters.
     * 5. Recalculate word_count.
     *
     * All of those operations occur inside one
     * PostgreSQL transaction.
     */
    const {
      data,
      error,
    } = await supabase.rpc(
      'replace_novel_chapters',
      {
        p_novel_id:
          novelId,

        p_chapters:
          rows,
      },
    );

    if (error) {
      if (
        error.code === 'P0002'
      ) {
        throw new NotFoundException(
          'Novel not found',
        );
      }

      throw error;
    }

    /*
     * Update basic novel metadata when
     * metadata was extracted from the book.
     *
     * This intentionally remains separate from
     * chapter replacement because these fields
     * are metadata rather than chapter aggregates.
     */
    const novelUpdate: Record<
      string,
      any
    > = {};

    if (document.title) {
      novelUpdate.title =
        document.title;
    }

    if (document.author) {
      novelUpdate.author_name =
        document.author;
    }

    if (
      Object.keys(
        novelUpdate,
      ).length > 0
    ) {
      novelUpdate.updated_at =
        new Date().toISOString();

      const {
        error: updateError,
      } = await supabase
        .from('novels')
        .update(novelUpdate)
        .eq(
          'id',
          novelId,
        );

      if (updateError) {
        throw updateError;
      }
    }

    return data ?? [];
  }

  /**
   * Public reader endpoint.
   *
   * IMPORTANT:
   * Only published chapters are returned.
   */
  async getPublishedChapters(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select(
        [
          'id',
          'novel_id',
          'title',
          'chapter_number',
          'word_count',
          'estimated_read_time',
          'is_published',
          'published_at',
        ].join(','),
      )
      .eq(
        'novel_id',
        novelId,
      )
      .eq(
        'is_published',
        true,
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

    return data ?? [];
  }

  /**
   * Public reader endpoint for a single chapter.
   */
  async getPublishedChapter(
    novelId: string,
    chapterNumber: number,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select('*')
      .eq(
        'novel_id',
        novelId,
      )
      .eq(
        'chapter_number',
        chapterNumber,
      )
      .eq(
        'is_published',
        true,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Published chapter not found',
      );
    }

    return data;
  }

  /**
   * Internal/admin view.
   *
   * This intentionally returns unpublished
   * chapters as well.
   */
  async getAllChapters(
    novelId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select('*')
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

    return data ?? [];
  }

  /**
   * Internal/admin view of a single chapter.
   */
  async getChapter(
    novelId: string,
    chapterNumber: number,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select('*')
      .eq(
        'novel_id',
        novelId,
      )
      .eq(
        'chapter_number',
        chapterNumber,
      )
      .maybeSingle();

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

  private countWords(
    content: string,
  ) {
    return content
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;
  }

  private estimateReadingMinutes(
    content: string,
  ) {
    const words =
      this.countWords(
        content,
      );

    return Math.max(
      1,
      Math.ceil(
        words / 200,
      ),
    );
  }
}