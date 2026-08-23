import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ChapterService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async create(dto: Record<string, unknown>) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .insert(dto)
        .select()
        .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async update(
    id: string,
    dto: Record<string, unknown>,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .update({
          ...dto,
          updated_at: new Date().toISOString(),
        })
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

    return data;
  }

  async remove(id: string) {
    const { error } =
      await this.database
        .getClient()
        .from('chapters')
        .delete()
        .eq('id', id);

    if (error) {
      throw error;
    }

    return {
      success: true,
      id,
    };
  }

  async chapter(id: string) {
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

    if (!data) {
      throw new NotFoundException(
        `Chapter ${id} not found.`,
      );
    }

    return data;
  }

  async chapters(novelId: string) {
    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}