import { Injectable } from '@nestjs/common';

@Injectable()
export class UserSimilarityService {

  /*
   * =====================================
   * Cosine Similarity
   * =====================================
   */

  similarity(
    first: number[],
    second: number[],
  ): number {

    if (
      first.length !== second.length
    ) {
      return 0;
    }

    let dot = 0;
    let firstMagnitude = 0;
    let secondMagnitude = 0;

    for (
      let i = 0;
      i < first.length;
      i++
    ) {

      dot += first[i] * second[i];

      firstMagnitude +=
        first[i] * first[i];

      secondMagnitude +=
        second[i] * second[i];

    }

    if (
      firstMagnitude === 0 ||
      secondMagnitude === 0
    ) {
      return 0;
    }

    return (
      dot /
      (
        Math.sqrt(firstMagnitude) *
        Math.sqrt(secondMagnitude)
      )
    );

  }

}