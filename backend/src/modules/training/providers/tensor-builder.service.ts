import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class TensorBuilderService {

  build(dataset: any[]) {

    const xs = tf.tensor2d(

      dataset.map(x => x.features),

    );

    const ys = tf.tensor2d(

      dataset.map(x => [x.label]),

    );

    return {

      xs,

      ys,

    };

  }

}