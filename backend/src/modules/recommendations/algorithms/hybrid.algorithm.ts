import { PopularityAlgorithm } from './popularity.algorithm';
import { CollaborativeAlgorithm } from './collaborative.algorithm';
import { ContentAlgorithm } from './content.algorithm';

export class HybridAlgorithm {

  static score(data: {

    popularity: number;

    trending: number;

    categoryMatch: boolean;

    authorMatch: boolean;

    tagMatches: number;

    commonReaders: number;

    completionRate: number;

  }) {

    return (

      PopularityAlgorithm.score(
        data.popularity,
        data.trending,
      ) +

      CollaborativeAlgorithm.score(
        data.commonReaders,
        data.completionRate,
      ) +

      ContentAlgorithm.similarity(
        data.categoryMatch,
        data.authorMatch,
        data.tagMatches,
      )

    );

  }

}