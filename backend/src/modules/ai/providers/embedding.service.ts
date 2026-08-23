import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  /*
   * =====================================
   * Story Embedding
   * =====================================
   */

  buildNovelEmbedding(novel: any): number[] {
    return [
      Number(novel.views ?? 0),
      Number(novel.rating ?? 0),
      Number(novel.total_chapters ?? 0),
      Number(novel.total_words ?? 0),
      Number(novel.popularity_score ?? 0),
      Number(novel.trending_score ?? 0),
      Number(novel.completion_rate ?? 0),
      Number(novel.total_readers ?? 0),
    ];
  }

  /*
   * =====================================
   * User Embedding
   * =====================================
   */

  buildUserEmbedding(profile: any): number[] {
    return [
      profile.favoriteCategories.length,
      profile.favoriteAuthors.length,
      profile.favoriteTags.length,
      profile.completedBooks.length,
      profile.currentlyReading.length,
      profile.averageCompletion,
      profile.totalReadingHours,
      profile.totalBooksRead,
    ];
  }

  /*
   * =====================================
   * Cosine Similarity
   * =====================================
   */

  similarity(
    a: number[],
    b: number[],
  ): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    if (magA === 0 || magB === 0) {
      return 0;
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
  }
}