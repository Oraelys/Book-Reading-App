import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class ChapterSearchService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  async search(
    novelId: string,
    query: string,
    limit = 20,
  ) {
    const search =
      query.trim();

    if (!search) {
      return [];
    }

    const { data, error } =
      await this.database
        .getClient()
        .from('chapters')
        .select(
          'id, novel_id, title, chapter_number, is_published',
        )
        .eq('novel_id', novelId)
        .or(
          `title.ilike.%${search}%,content.ilike.%${search}%`,
        )
        .order(
          'chapter_number',
          {
            ascending: true,
          },
        )
        .limit(limit);

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}