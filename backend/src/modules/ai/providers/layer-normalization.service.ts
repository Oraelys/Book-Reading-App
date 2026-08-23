import { Injectable } from '@nestjs/common';

@Injectable()
export class LayerNormalizationService {

  normalize(
    vector: number[],
  ) {

    const mean =
      vector.reduce(
        (a, b) => a + b,
        0,
      ) / vector.length;

    const variance =
      vector.reduce(
        (sum, value) =>

          sum +

          Math.pow(
            value - mean,
            2,
          ),

        0,
      ) / vector.length;

    const std =
      Math.sqrt(variance + 1e-8);

    return vector.map(

      value =>

        (value - mean) / std,

    );

  }

}