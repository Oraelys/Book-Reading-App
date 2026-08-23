import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { RecommendationProfile } from './interfaces/user-profile.interface';

@Injectable()
export class RecommendationProfileService {

  constructor(
    private readonly database: SupabaseService,
  ) {}

  async build(
    userId: string,
  ): Promise<RecommendationProfile> {

    const supabase = this.database.getClient();

    /*
     * Reading History
     */

    const { data: reading } =
      await supabase
        .from('reading_progress')
        .select(`
          novel_id,
          novels(
            category,
            author_id
          )
        `)
        .eq('user_id', userId);

    /*
     * Followed Stories
     */

    const { data: follows } =
      await supabase
        .from('story_follows')
        .select('novel_id')
        .eq('user_id', userId);

    const categories =
      new Set<string>();

    const authors =
      new Set<string>();

    const excluded =
      new Set<string>();

    reading?.forEach((item: any) => {

      excluded.add(item.novel_id);

      if (item.novels?.category) {

        categories.add(
          item.novels.category,
        );

      }

      if (item.novels?.author_id) {

        authors.add(
          item.novels.author_id,
        );

      }

    });

    return {

      userId,

      favoriteCategories:
        [...categories],

      favoriteTags: [],

      favoriteAuthors:
        [...authors],

      favoriteSeries: [],

      excludedNovels:
        [...excluded],

    };

  }

}