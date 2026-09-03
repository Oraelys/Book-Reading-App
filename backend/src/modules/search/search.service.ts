import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { SearchAnalyticsService } from './search-analytics.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly database: SupabaseService,
    private readonly analytics:
      SearchAnalyticsService,
  ) {}

  /*
   * =====================================
   * Global Search
   * =====================================
   */

  async search(
    query: string,
    page = 1,
    limit = 20,
  ) {
    const offset =
      (page - 1) * limit;

    const supabase =
      this.database.getClient();

    /*
     * Search published novels only.
     */

    const {
      data: novels,
    } = await supabase
      .from('novels')
      .select('*')
      .or(
        `title.ilike.%${query}%,description.ilike.%${query}%`,
      )
      .eq(
        'status',
        'published',
      )
      .range(
        offset,
        offset + limit - 1,
      );

    /*
     * Search series.
     *
     * Series are kept as they were because the
     * current series schema/status contract has not
     * been changed in this phase.
     */

    const {
      data: series,
    } = await supabase
      .from('series')
      .select('*')
      .or(
        `name.ilike.%${query}%,description.ilike.%${query}%`,
      );

    /*
     * Search published chapters only.
     *
     * The parent novel must also be published.
     */

    const {
      data: chapterRows,
      error: chapterError,
    } = await supabase
      .from('chapters')
      .select(`
        id,
        title,
        novel_id,
        novels!inner(status)
      `)
      .ilike(
        'title',
        `%${query}%`,
      )
      .eq(
        'is_published',
        true,
      )
      .eq(
        'novels.status',
        'published',
      );

    if (chapterError) {
      throw chapterError;
    }

    /*
     * Do not expose the internal joined novel
     * status object through the public search API.
     */

    const chapters =
      (chapterRows ?? []).map(
        (chapter) => ({
          id: chapter.id,
          title: chapter.title,
          novel_id: chapter.novel_id,
        }),
      );

    await this.analytics.save({
      userId: undefined,

      query,

      resultCount:
        (novels?.length ?? 0) +
        (series?.length ?? 0) +
        chapters.length,
    });

    return {
      novels: novels ?? [],

      series: series ?? [],

      chapters,

      total:
        (novels?.length ?? 0) +
        (series?.length ?? 0) +
        chapters.length,
    };
  }

  /*
   * =====================================
   * Autocomplete
   * =====================================
   */

  async autocomplete(
    query: string,
  ) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select(
        'id,title',
      )
      .ilike(
        'title',
        `${query}%`,
      )
      .eq(
        'status',
        'published',
      )
      .limit(10);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Trending Searches
   * =====================================
   */

  async trending() {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('search_history')
      .select(`
        query,
        count
      `)
      .order(
        'count',
        {
          ascending: false,
        },
      )
      .limit(20);

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}