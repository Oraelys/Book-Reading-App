import { Injectable } from '@nestjs/common';

@Injectable()
export class NegativeSamplingService {

  sample(
    positives: string[],
    candidates: string[],
    count = 5,
  ) {

    const negatives =
      candidates.filter(
        id =>
          !positives.includes(id),
      );

    return negatives
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

  }

}