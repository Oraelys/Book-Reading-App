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
     * Search novels
     */

    const { data: novels } =
      await supabase
        .from('novels')
        .select('*')
        .or(
          `title.ilike.%${query}%,description.ilike.%${query}%`,
        )
        .eq('status', 'published')
        .range(
          offset,
          offset + limit - 1,
        );

    /*
     * Search series
     */

    const { data: series } =
      await supabase
        .from('series')
        .select('*')
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%`,
        );

    /*
     * Search chapters
     */

    const { data: chapters } =
      await supabase
        .from('chapters')
        .select(`
          id,
          title,
          novel_id
        `)
        .ilike(
          'title',
          `%${query}%`,
        );

        await this.analytics.save({

    userId: undefined,

    query,

    resultCount:

        (novels?.length ?? 0) +

        (series?.length ?? 0) +

        (chapters?.length ?? 0),

});

    return {

      novels,

      series,

      chapters,

      total:

        (novels?.length ?? 0) +

        (series?.length ?? 0) +

        (chapters?.length ?? 0),

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

    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('id,title')
        .ilike(
          'title',
          `${query}%`,
        )
        .limit(10);

    if (error)
      throw error;

    return data;

  }

  /*
   * =====================================
   * Trending Searches
   * =====================================
   */

  async trending() {

    const { data, error } =
      await this.database
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

    if (error)
      throw error;

    return data;

  }

}