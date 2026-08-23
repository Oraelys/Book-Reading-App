import { Injectable } from '@nestjs/common';

@Injectable()
export class SequencePoolingService {

  average(

    sequence: number[][],

  ): number[] {

    if (!sequence.length) {

      return [];

    }

    const dimensions =

      sequence[0].length;

    const output =

      Array(dimensions).fill(0);

    sequence.forEach(vector => {

      vector.forEach(

        (value, index) => {

          output[index] += value;

        },

      );

    });

    return output.map(

      value =>

        value / sequence.length,

    );

  }

}