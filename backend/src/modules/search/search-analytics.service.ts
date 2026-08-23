import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { CreateSearchHistoryDto } from './dto/create-search-history.dto';

@Injectable()
export class SearchAnalyticsService {

  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * =====================================
   * Save Search
   * =====================================
   */

  async save(
    dto: CreateSearchHistoryDto,
  ) {

    const { data, error } =
      await this.database
        .getClient()
        .from('search_history')
        .insert({

          user_id: dto.userId,

          query: dto.query,

          result_count:
            dto.resultCount,

        })
        .select()
        .single();

    if (error)
      throw error;

    return data;

  }

  /*
   * =====================================
   * Popular Searches
   * =====================================
   */

  async popular() {

    const { data, error } =
      await this.database
        .getClient()
        .rpc(
          'popular_searches',
        );

    if (error)
      throw error;

    return data;

  }

}