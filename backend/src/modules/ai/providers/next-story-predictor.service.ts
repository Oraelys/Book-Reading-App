import { Injectable } from '@nestjs/common';

@Injectable()
export class NextStoryPredictorService {

  predict(

    probabilities: number[],

  ) {

    let index = 0;

    let max = -Infinity;

    probabilities.forEach(

      (value, i) => {

        if (value > max) {

          max = value;

          index = i;

        }

      },

    );

    return index;

  }

}