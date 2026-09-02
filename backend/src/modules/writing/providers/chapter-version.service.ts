
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

@Injectable()
export class ChapterVersionService {
  constructor(
    private readonly database:
      SupabaseService,
  ) {}

  /**
   * Create a snapshot of a chapter.
   *
   * createdBy should normally be the authenticated
   * user's id.
   */
  async createSnapshot(
    chapterId: string,
    content: string,
    createdBy?: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: chapter,
      error: chapterError,
    } = await supabase
      .from('chapters')
      .select('id')
      .eq(
        'id',
        chapterId,
      )
      .maybeSingle();

    if (chapterError) {
      throw chapterError;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from('chapter_versions')
      .insert({
        chapter_id:
          chapterId,

        content,

        created_by:
          createdBy ?? null,

        created_at:
          new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Return all versions belonging to a chapter.
   */
  async versions(
    chapterId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapter_versions')
      .select('*')
      .eq(
        'chapter_id',
        chapterId,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /**
   * Return the latest version.
   */
  async latest(
    chapterId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapter_versions')
      .select('*')
      .eq(
        'chapter_id',
        chapterId,
      )
      .order(
        'created_at',
        {
          ascending: false,
        },
      )
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }



  /**
   * Resolve a version by id.
   */
  async getVersion(
    versionId: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('chapter_versions')
      .select(
        'id, chapter_id, content, created_by, created_at',
      )
      .eq(
        'id',
        versionId,
      )
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Version not found.',
      );
    }

    return data;
  }


  /**
   * Restore a version.
   *
   * Ownership must be checked by the caller before
   * reaching this method.
   */
  async restore(
    versionId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: version,
      error: versionError,
    } = await supabase
      .from('chapter_versions')
      .select('*')
      .eq(
        'id',
        versionId,
      )
      .maybeSingle();

    if (versionError) {
      throw versionError;
    }

    if (!version) {
      throw new NotFoundException(
        'Version not found.',
      );
    }

    const now =
      new Date().toISOString();

    const {
      data: chapter,
      error,
    } = await supabase
      .from('chapters')
      .update({
        content:
          version.content,

        last_saved_at:
          now,

        updated_at:
          now,
      })
      .eq(
        'id',
        version.chapter_id,
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return chapter;
  }

  /**
   * Delete a version.
   *
   * Ownership must be checked by the caller.
   */
  async delete(
    versionId: string,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: version,
      error: versionError,
    } = await supabase
      .from('chapter_versions')
      .select('id')
      .eq(
        'id',
        versionId,
      )
      .maybeSingle();

    if (versionError) {
      throw versionError;
    }

    if (!version) {
      throw new NotFoundException(
        'Version not found.',
      );
    }

    const {
      error,
    } = await supabase
      .from('chapter_versions')
      .delete()
      .eq(
        'id',
        versionId,
      );

    if (error) {
      throw error;
    }

    return {
      success: true,
      versionId,
    };
  }

  /**
   * Delete every version belonging to a chapter.
   *
   * Ownership must be checked by the caller.
   */
  async clear(
    chapterId: string,
  ) {
    const {
      error,
    } = await this.database
      .getClient()
      .from('chapter_versions')
      .delete()
      .eq(
        'chapter_id',
        chapterId,
      );

    if (error) {
      throw error;
    }

    return {
      success: true,
      chapterId,
    };
  }
}

