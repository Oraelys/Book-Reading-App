import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class PreferencesService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * =====================================
   * Get Profile
   * =====================================
   */

  async get(userId: string) {
    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  /*
   * =====================================
   * Rebuild
   * =====================================
   */

  async rebuild(userId: string) {
    const supabase =
      this.database.getClient();

    /*
     * Reading Progress
     *
     * Only published novels should contribute
     * to the user's preference profile.
     */

    const {
      data: reading,
    } = await supabase
      .from('reading_progress')
      .select(`
        *,
        novels!inner(
          category,
          created_by
        )
      `)
      .eq('user_id', userId)
      .eq('novels.status', 'published');

    const categories =
      new Map<string, number>();

    const authors =
      new Map<string, number>();

    let completed = 0;
    let started = 0;

    reading?.forEach((item: any) => {
      started++;

      if (
        item.progress_percentage >= 100
      ) {
        completed++;
      }

      if (item.novels?.category) {
        categories.set(
          item.novels.category,
          (categories.get(
            item.novels.category,
          ) || 0) + 1,
        );
      }

      if (item.novels?.created_by) {
        authors.set(
          item.novels.created_by,
          (authors.get(
            item.novels.created_by,
          ) || 0) + 1,
        );
      }
    });

    const favoriteCategories =
      [...categories.entries()]
        .sort(
          (a, b) => b[1] - a[1],
        )
        .map(
          category => category[0],
        );

    const favoriteAuthors =
      [...authors.entries()]
        .sort(
          (a, b) => b[1] - a[1],
        )
        .map(
          author => author[0],
        );

    const completionRate =
      started === 0
        ? 0
        : (completed / started) * 100;

    const payload = {
      user_id: userId,

      favorite_categories:
        favoriteCategories,

      favorite_authors:
        favoriteAuthors,

      average_completion_rate:
        completionRate,

      books_started: started,

      books_completed: completed,

      updated_at: new Date(),

      last_calculated:
        new Date(),
    };

    const {
      data,
      error,
    } = await supabase
      .from('user_preferences')
      .upsert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}