import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureVectorService {

  build(
    profile: any,
    novel: any,
  ) {

    return [

      novel.views ?? 0,

      novel.rating ?? 0,

      novel.total_ratings ?? 0,

      novel.word_count ?? 0,

      novel.popularity_score ?? 0,

      novel.trending_score ?? 0,

      profile.favoriteCategories.includes(
        novel.category,
      )
        ? 1
        : 0,

    ];

  }

}