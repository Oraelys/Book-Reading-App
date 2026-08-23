import { Injectable } from '@nestjs/common';

@Injectable()
export class TrainingSampleBuilderService {

  split(
    dataset: {
      features: number[];
      label: number;
    }[],
    userFeatureCount: number,
  ) {

    const users: number[][] = [];

    const novels: number[][] = [];

    const labels: number[] = [];

    dataset.forEach(sample => {

      users.push(
        sample.features.slice(
          0,
          userFeatureCount,
        ),
      );

      novels.push(
        sample.features.slice(
          userFeatureCount,
        ),
      );

      labels.push(
        sample.label,
      );

    });

    return {

      users,

      novels,

      labels,

    };

  }

}