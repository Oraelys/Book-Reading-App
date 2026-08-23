import { Injectable } from '@nestjs/common';

@Injectable()
export class BatchGeneratorService {

  generate<T>(
    dataset: T[],
    batchSize = 256,
  ) {

    const batches: T[][] = [];

    for (
      let i = 0;
      i < dataset.length;
      i += batchSize
    ) {

      batches.push(
        dataset.slice(
          i,
          i + batchSize,
        ),
      );

    }

    return batches;

  }

}