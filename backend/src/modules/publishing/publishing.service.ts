import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { ChapterPublishService } from '../writing/providers/chapter-publish.service';

@Injectable()
export class PublishingService {
  constructor(
    private readonly database: SupabaseService,
    private readonly chapterPublishService:
      ChapterPublishService,
  ) {}

  /**
   * Validate a story before publication.
   */
  async validateStory(
    novelId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error: novelError,
    } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .maybeSingle();

    if (novelError) {
      throw novelError;
    }

    if (!novel) {
      throw new NotFoundException(
        'Story not found.',
      );
    }

    const {
      data: chapters,
      error: chapterError,
    } = await supabase
      .from('chapters')
      .select(
        `
        id,
        title,
        content,
        chapter_number,
        word_count,
        status,
        is_published
        `,
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

    if (chapterError) {
      throw chapterError;
    }

    const errors: {
      field: string;
      message: string;
    }[] = [];

    /*
     * Story validation
     */

    if (!novel.title?.trim()) {
      errors.push({
        field: 'title',
        message:
          'Story title is required.',
      });
    }

    if (!novel.description?.trim()) {
      errors.push({
        field: 'description',
        message:
          'Story description is required.',
      });
    }

    if (!novel.cover_image_url) {
      errors.push({
        field: 'cover',
        message:
          'Cover image is required.',
      });
    }

    if (!novel.author_name?.trim()) {
      errors.push({
        field: 'author_name',
        message:
          'Author name is required.',
      });
    }

    if (!novel.category?.trim()) {
      errors.push({
        field: 'category',
        message:
          'Category is required.',
      });
    }

    /*
     * Chapter validation
     */

    if (
      !chapters ||
      chapters.length === 0
    ) {
      errors.push({
        field: 'chapters',
        message:
          'At least one chapter must exist.',
      });
    } else {
      const published =
        chapters.filter(
          (chapter) =>
            chapter.status ===
              'published' ||
            chapter.is_published === true,
        );

      if (published.length === 0) {
        errors.push({
          field: 'published',
          message:
            'Publish at least one chapter.',
        });
      }

      const numbers =
        chapters.map(
          (chapter) =>
            chapter.chapter_number,
        );

      const duplicates =
        numbers.filter(
          (number, index) =>
            numbers.indexOf(
              number,
            ) !== index,
        );

      if (
        duplicates.length > 0
      ) {
        errors.push({
          field:
            'chapter_number',
          message:
            'Duplicate chapter numbers detected.',
        });
      }

      published.forEach(
        (chapter) => {
          if (
            !chapter.content?.trim()
          ) {
            errors.push({
              field:
                `chapter_${chapter.chapter_number}`,
              message:
                `Published Chapter ${chapter.chapter_number} has no content.`,
            });
          }
        },
      );
    }

    return {
      canPublish:
        errors.length === 0,

      errors,
    };
  }

  /**
   * Publish an entire story.
   *
   * Chapter publication itself is delegated
   * to the canonical Writing domain.
   */
  async publishStory(
    novelId: string,
  ) {
    const validation =
      await this.validateStory(
        novelId,
      );

    if (
      !validation.canPublish
    ) {
      throw new BadRequestException(
        validation,
      );
    }

    const supabase =
      this.database.getClient();

    const now =
      new Date().toISOString();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .update({
        status: 'published',
        is_public: true,
        published_at: now,
        updated_at: now,
      })
      .eq(
        'id',
        novelId,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,

      message:
        'Story published successfully.',

      novel,
    };
  }

  /**
   * Unpublish an entire story.
   */
  async unpublishStory(
    novelId: string,
  ) {
    const supabase =
      this.database.getClient();

    const now =
      new Date().toISOString();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .update({
        status: 'draft',
        is_public: false,
        updated_at: now,
      })
      .eq(
        'id',
        novelId,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,

      message:
        'Story unpublished.',

      novel,
    };
  }

  /**
   * Validate a chapter.
   *
   * Delegates actual chapter rules
   * to the Writing domain.
   */
  async validateChapter(
    chapterId: string,
  ) {
    const status =
      await this.chapterPublishService
        .status(
          chapterId,
        );

    const supabase =
      this.database.getClient();

    const {
      data: chapter,
      error,
    } = await supabase
      .from('chapters')
      .select(
        `
        id,
        title,
        content,
        word_count,
        status,
        is_published
        `,
      )
      .eq(
        'id',
        chapterId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    const errors: {
      field: string;
      message: string;
    }[] = [];

    if (!chapter.title?.trim()) {
      errors.push({
        field: 'title',
        message:
          'Chapter title is required.',
      });
    }

    if (!chapter.content?.trim()) {
      errors.push({
        field: 'content',
        message:
          'Chapter content is empty.',
      });
    }

    if (
      (chapter.word_count ?? 0) <
      50
    ) {
      errors.push({
        field: 'word_count',
        message:
          'Chapter is too short.',
      });
    }

    return {
      canPublish:
        errors.length === 0,

      errors,

      chapter,

      status,
    };
  }

  /**
   * Delegate chapter publication
   * to WritingModule.
   */
  async publishChapter(
    chapterId: string,
  ) {
    return this.chapterPublishService
      .publish(chapterId);
  }

  /**
   * Delegate chapter unpublication
   * to WritingModule.
   */
  async unpublishChapter(
    chapterId: string,
  ) {
    return this.chapterPublishService
      .unpublish(chapterId);
  }
}