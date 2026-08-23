import { Injectable } from '@nestjs/common';

import * as tf from '@tensorflow/tfjs';

@Injectable()
export class SequenceTensorBuilderService {

  build(
    dataset: {

      input: number[];

      output: number[];

    }[],
  ) {

    const xs =
      tf.tensor2d(

        dataset.map(

          d => d.input,

        ),

      );

    const ys =
      tf.tensor2d(

        dataset.map(

          d => d.output,

        ),

      );

    return {

      xs,

      ys,

    };

  }

}