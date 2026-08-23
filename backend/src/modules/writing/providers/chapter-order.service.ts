import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

@Injectable()
export class ChapterOrderService {
  constructor(
    private readonly database:
      SupabaseService,
  ) {}

  async reorder(
    novelId: string,
    chapterId: string,
    newPosition: number,
  ) {
    const client =
      this.database.getClient();

    const {
      data: chapters,
      error,
    } = await client
      .from('chapters')
      .select(
        'id, chapter_number',
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

    if (!chapters?.length) {
      throw new NotFoundException(
        'No chapters found for this novel.',
      );
    }

    const currentIndex =
      chapters.findIndex(
        (chapter) =>
          chapter.id === chapterId,
      );

    if (currentIndex === -1) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    const boundedPosition =
      Math.max(
        0,
        Math.min(
          newPosition,
          chapters.length - 1,
        ),
      );

    const reordered =
      [...chapters];

    const [moved] =
      reordered.splice(
        currentIndex,
        1,
      );

    reordered.splice(
      boundedPosition,
      0,
      moved,
    );

    /*
     * Temporarily move all chapters
     * to negative positions.
     *
     * This prevents the unique
     * (novel_id, chapter_number)
     * constraint from being violated
     * during the reorder.
     */
    for (
      let index = 0;
      index < reordered.length;
      index++
    ) {
      const {
        error: temporaryError,
      } = await client
        .from('chapters')
        .update({
          chapter_number:
            -(index + 1),
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          reordered[index].id,
        );

      if (temporaryError) {
        throw temporaryError;
      }
    }

    /*
     * Assign the final chapter
     * numbers.
     */
    for (
      let index = 0;
      index < reordered.length;
      index++
    ) {
      const {
        error: updateError,
      } = await client
        .from('chapters')
        .update({
          chapter_number:
            index + 1,
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          'id',
          reordered[index].id,
        );

      if (updateError) {
        throw updateError;
      }
    }

    return {
      success: true,
      novelId,
      chapters:
        reordered.map(
          (chapter, index) => ({
            id: chapter.id,
            chapterNumber:
              index + 1,
          }),
        ),
    };
  }

  async moveUp(
    novelId: string,
    chapterId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select(
        'id, chapter_number',
      )
      .eq(
        'id',
        chapterId,
      )
      .eq(
        'novel_id',
        novelId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return this.reorder(
      novelId,
      chapterId,
      Math.max(
        0,
        data.chapter_number - 2,
      ),
    );
  }

  async moveDown(
    novelId: string,
    chapterId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapters')
      .select(
        'id, chapter_number',
      )
      .eq(
        'id',
        chapterId,
      )
      .eq(
        'novel_id',
        novelId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return this.reorder(
      novelId,
      chapterId,
      data.chapter_number,
    );
  }
}