import { Injectable } from '@nestjs/common';

@Injectable()
export class EmbeddingRankingService {
  rank(
    novels: any[],
    scores: Map<string, number>,
  ) {
    return novels.sort(
      (a, b) =>
        (scores.get(b.id) ?? 0) -
        (scores.get(a.id) ?? 0),
    );
  }
}