import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingBuilderService {

  /*
   * =====================================
   * User Embedding
   * =====================================
   */

  buildUserEmbedding(
    profile: any,
  ): number[] {

    return [

      profile.totalReads ?? 0,

      profile.totalCompleted ?? 0,

      profile.averageCompletion ?? 0,

      profile.averageReadingTime ?? 0,

      profile.favoriteCategories.length,

      profile.favoriteTags.length,

      profile.favoriteAuthors.length,

      profile.premiumRatio ?? 0,

      profile.nightReader ? 1 : 0,

      profile.weekendReader ? 1 : 0,

    ];

  }

  /*
   * =====================================
   * Story Embedding
   * =====================================
   */

  buildNovelEmbedding(
    novel: any,
  ): number[] {

    return [

      novel.views ?? 0,

      novel.rating ?? 0,

      novel.total_ratings ?? 0,

      novel.total_chapters ?? 0,

      novel.word_count ?? 0,

      novel.completion_rate ?? 0,

      novel.trending_score ?? 0,

      novel.popularity_score ?? 0,

      novel.is_premium ? 1 : 0,

      novel.is_completed ? 1 : 0,

    ];

  }

  /*
   * =====================================
   * Merge Pair
   * =====================================
   */

  merge(
    user: number[],
    novel: number[],
  ): number[] {

    return [
      ...user,
      ...novel,
    ];

  }

}