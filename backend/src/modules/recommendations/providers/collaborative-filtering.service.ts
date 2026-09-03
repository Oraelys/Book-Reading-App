import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';
import { UserSimilarityService } from './user-similarity.service';

@Injectable()
export class CollaborativeFilteringService {
  constructor(
    private readonly database: SupabaseService,

    private readonly similarity: UserSimilarityService,
  ) {}

  /*
   * =====================================
   * Find Similar Readers
   * =====================================
   */

  async similarUsers(
    userId: string,
    embedding: number[],
  ) {
    const supabase =
      this.database.getClient();

    const {
      data,
      error,
    } = await supabase
      .from('user_embeddings')
      .select('*');

    if (error) {
      throw error;
    }

    return (data ?? [])
      .filter(
        user =>
          user.user_id !== userId,
      )
      .map(user => ({
        userId: user.user_id,

        score:
          this.similarity.similarity(
            embedding,
            user.embedding,
          ),
      }))
      .sort(
        (a, b) =>
          b.score - a.score,
      );
  }

  /*
   * =====================================
   * Books Read By Similar Users
   * =====================================
   */

  async recommendations(
    similarUsers: any[],
  ) {
    const ids =
      similarUsers
        .slice(0, 25)
        .map(
          user =>
            user.userId,
        );

    if (!ids.length) {
      return [];
    }

    const {
      data,
      error,
    } = await this.database
      .getClient()
      .from('reading_progress')
      .select(`
          *,
          novels!inner(*)
      `)
      .in(
        'user_id',
        ids,
      )
      .eq(
        'novels.status',
        'published',
      )
      .gte(
        'progress_percentage',
        60,
      );

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}