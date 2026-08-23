import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureScalerService {

  /*
   * =====================================
   * Min-Max Scaling
   * =====================================
   */

  scale(dataset: any[]) {

    if (!dataset.length) {
      return dataset;
    }

    const featureCount =
      dataset[0].features.length;

    const mins = Array(featureCount).fill(Infinity);
    const maxs = Array(featureCount).fill(-Infinity);

    for (const row of dataset) {
      row.features.forEach((value: number, index: number) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    }

    return dataset.map(row => ({

      ...row,

      features: row.features.map(
        (value: number, index: number) => {

          const range =
            maxs[index] - mins[index];

          if (range === 0) {
            return 0;
          }

          return (
            (value - mins[index]) /
            range
          );

        },
      ),

    }));

  }

}