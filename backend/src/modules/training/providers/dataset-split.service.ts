import { Injectable } from '@nestjs/common';

@Injectable()
export class DatasetSplitService {

  split(dataset: any[]) {

    const shuffled =
      [...dataset].sort(
        () => Math.random() - 0.5,
      );

    const trainSize =
      Math.floor(
        shuffled.length * 0.8,
      );

    return {

      train:
        shuffled.slice(0, trainSize),

      test:
        shuffled.slice(trainSize),

    };

  }

}