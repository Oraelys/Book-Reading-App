import { Injectable } from '@nestjs/common';

@Injectable()
export class ScaledDotProductService {

  attention(

    query: number[],

    keys: number[][],

    values: number[][],

  ) {

    const scores = keys.map(key => {

      let dot = 0;

      for (let i = 0; i < key.length; i++) {

        dot += key[i] * query[i];

      }

      return dot / Math.sqrt(key.length);

    });

    const max =
      Math.max(...scores);

    const exps =
      scores.map(s => Math.exp(s - max));

    const total =
      exps.reduce(
        (a, b) => a + b,
        0,
      );

    const weights =
      exps.map(
        e => e / total,
      );

    const output =
      Array(values[0].length).fill(0);

    weights.forEach(
      (weight, i) => {

        values[i].forEach(
          (value, j) => {

            output[j] +=
              value * weight;

          },
        );

      },
    );

    return output;

  }

}