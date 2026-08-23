import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  SupabaseService,
} from '../../database/supabase.service';

@Injectable()
export class ChapterLockService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async acquire(
    chapterId: string,
    userId: string,
  ) {
    const client =
      this.database.getClient();

    const { data: chapter, error } =
      await client
        .from('chapters')
        .select(
          'id, locked_by, locked_at',
        )
        .eq('id', chapterId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    if (
      chapter.locked_by &&
      chapter.locked_by !== userId
    ) {
      throw new ConflictException(
        'Chapter is currently being edited by another user.',
      );
    }

    const now =
      new Date().toISOString();

    const { data, error: updateError } =
      await client
        .from('chapters')
        .update({
          locked_by: userId,
          locked_at: now,
          updated_at: now,
        })
        .eq('id', chapterId)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      chapter: data,
    };
  }

  async release(
    chapterId: string,
    userId: string,
  ) {
    const client =
      this.database.getClient();

    const { data: chapter, error } =
      await client
        .from('chapters')
        .select(
          'id, locked_by',
        )
        .eq('id', chapterId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!chapter) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    if (
      chapter.locked_by &&
      chapter.locked_by !== userId
    ) {
      throw new ConflictException(
        'You cannot release another user\'s chapter lock.',
      );
    }

    const { data, error: updateError } =
      await client
        .from('chapters')
        .update({
          locked_by: null,
          locked_at: null,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', chapterId)
        .select()
        .single();

    if (updateError) {
      throw updateError;
    }

    return {
      success: true,
      chapter: data,
    };
  }

  async status(
    chapterId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .select(
          'id, locked_by, locked_at',
        )
        .eq('id', chapterId)
        .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException(
        'Chapter not found.',
      );
    }

    return {
      chapterId,
      locked: Boolean(
        data.locked_by,
      ),
      lockedBy:
        data.locked_by,
      lockedAt:
        data.locked_at,
    };
  }
}