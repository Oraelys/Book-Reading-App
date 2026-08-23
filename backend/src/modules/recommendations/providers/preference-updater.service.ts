import { Injectable } from '@nestjs/common';

import { UserPreferenceService } from './user-preference.service';
import { EmbeddingService } from '../../ai/providers/embedding.service';

@Injectable()
export class PreferenceUpdaterService {
  constructor(
    private readonly preferences: UserPreferenceService,
    private readonly embeddings: EmbeddingService,
  ) {}

  async update(
    userId: string,
    novel: any,
  ) {
    const existing =
      await this.preferences.get(userId);

    const storyVector =
      this.embeddings.buildNovelEmbedding(
        novel,
      );

    if (!existing) {
      return this.preferences.save(
        userId,
        storyVector,
      );
    }

    const updated =
      existing.vector.map(
        (value: number, index: number) =>
          (value + storyVector[index]) / 2,
      );

    return this.preferences.save(
      userId,
      updated,
    );
  }
}