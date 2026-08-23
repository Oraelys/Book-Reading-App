import { Injectable } from '@nestjs/common';

import { EmbeddingBuilderService } from './embedding-builder.service';

@Injectable()
export class EmbeddingTrainerService {

  constructor(
    private readonly builder: EmbeddingBuilderService,
  ) {}

  /*
   * =====================================
   * Build Training Dataset
   * =====================================
   */

  buildTrainingPairs(
    users: any[],
    novels: any[],
  ) {

    const dataset: {
      features: number[];
      label: number;
    }[] = [];

    for (const user of users) {

      const userVector =
        this.builder.buildUserEmbedding(user);

      /*
       * Positive Samples
       */

      for (const novel of novels) {

        if (
          user.readNovels?.includes(novel.id)
        ) {

          const novelVector =
            this.builder.buildNovelEmbedding(
              novel,
            );

          dataset.push({

            features:
              this.builder.merge(
                userVector,
                novelVector,
              ),

            label: 1,

          });

        }

      }

      /*
       * Negative Samples
       */

      for (const novel of novels) {

        if (
          !user.readNovels?.includes(novel.id)
        ) {

          const novelVector =
            this.builder.buildNovelEmbedding(
              novel,
            );

          dataset.push({

            features:
              this.builder.merge(
                userVector,
                novelVector,
              ),

            label: 0,

          });

        }

      }

    }

    return dataset;

  }

}