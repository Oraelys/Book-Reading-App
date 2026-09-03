import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';
import { RecommendationProfileService } from './profile.service';

import { InferenceService } from '../ai/providers/inference.service';
import { FeatureVectorService } from '../ai/providers/feature-vector.service';
import { RankingService } from '../ai/providers/ranking.service';
import { EmbeddingService } from '../ai/providers/embedding.service';
import { CollaborativeFilteringService } from './providers/collaborative-filtering.service';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly database: SupabaseService,
    private readonly profileService: RecommendationProfileService,

    private readonly inference: InferenceService,
    private readonly featureBuilder: FeatureVectorService,
    private readonly ranking: RankingService,

    private readonly collaborative: CollaborativeFilteringService,

    private readonly embeddings: EmbeddingService,
  ) {}

  /*
   * =====================================
   * Personalized Home Feed
   * =====================================
   */

  async home(
    userId: string,
    limit = 20,
  ) {
    const profile =
      await this.profileService.build(userId);

    const { data: novels, error } =
      await this.database
        .getClient()
        .from('novels')
        .select(`
            *,
            novel_tags(tag_id)
        `)
        .eq('status', 'published');

    if (error) {
      throw error;
    }

    const scored = await Promise.all(
      (novels ?? [])
        .filter(
          novel =>
            !profile.excludedNovels.includes(
              novel.id,
            ),
        )
        .map(async novel => {
          const vector =
            this.featureBuilder.build(
              profile,
              novel,
            );

          const aiScore =
            this.inference.predict(
              vector,
            );

          return {
            ...novel,
            aiScore,
          };
        }),
    );

    return this.ranking
      .rank(scored)
      .slice(0, limit);
  }

  /*
   * =====================================
   * Trending
   * =====================================
   */

  async trending(limit = 20) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('trending_score', {
          ascending: false,
        })
        .limit(limit);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * New Releases
   * =====================================
   */

  async newest(limit = 20) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .order('published_at', {
          ascending: false,
        })
        .limit(limit);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Continue Reading
   * =====================================
   */

  async continueReading(
    userId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('reading_progress')
        .select(`
            *,
            novels!inner(*)
        `)
        .eq('user_id', userId)
        .eq('novels.status', 'published')
        .lt(
          'progress_percentage',
          100,
        )
        .order('last_read', {
          ascending: false,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Similar Stories
   * =====================================
   */

  async similar(
    novelId: string,
    limit = 20,
  ) {
    const supabase =
      this.database.getClient();

    const {
      data: novel,
      error,
    } = await supabase
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .eq('status', 'published')
      .single();

    if (error) {
      throw error;
    }

    const {
      data,
      error: similarError,
    } = await supabase
      .from('novels')
      .select('*')
      .eq('status', 'published')
      .eq('category', novel.category)
      .neq('id', novel.id)
      .limit(limit);

    if (similarError) {
      throw similarError;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Same Author
   * =====================================
   */

  async author(
    authorId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .eq('author_id', authorId);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Same Category
   * =====================================
   */

  async category(
    category: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('novels')
        .select('*')
        .eq('status', 'published')
        .eq('category', category);

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Series Reading Order
   * =====================================
   */

  async series(
    seriesId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('series_stories')
        .select(`
            story_order,
            novels!inner(*)
        `)
        .eq('series_id', seriesId)
        .eq('novels.status', 'published')
        .order('story_order');

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Because You Read
   * =====================================
   */

  async becauseYouRead(
    userId: string,
    novelId: string,
  ) {
    await this.profileService.build(
      userId,
    );

    const {
      data: novel,
      error,
    } = await this.database
      .getClient()
      .from('novels')
      .select('*')
      .eq('id', novelId)
      .eq('status', 'published')
      .single();

    if (error || !novel) {
      return [];
    }

    return this.category(
      novel.category,
    );
  }

  /*
   * =====================================
   * Collaborative Recommendations
   * =====================================
   */

  async collaborativeRecommendations(
    userId: string,
  ) {
    const profile =
      await this.profileService.build(
        userId,
      );

    const embedding =
      this.embeddings.buildUserEmbedding(
        profile,
      );

    const users =
      await this.collaborative.similarUsers(
        userId,
        embedding,
      );

    return this.collaborative.recommendations(
      users,
    );
  }
}