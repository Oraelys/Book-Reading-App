import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class TransformerModelService {

  build(
    sequenceLength: number,
    embeddingSize: number,
    vocabularySize: number,
  ): tf.LayersModel {

    const input = tf.input({

      shape: [sequenceLength],

      dtype: 'int32',

    });

    /*
     * Token Embedding
     */

    let x =
      tf.layers.embedding({

        inputDim: vocabularySize,

        outputDim: embeddingSize,

      }).apply(input) as tf.SymbolicTensor;

    /*
     * Transformer approximation
     */

    x =
      tf.layers.flatten().apply(
        x,
      ) as tf.SymbolicTensor;

    x =
      tf.layers.dense({

        units: 256,

        activation: 'relu',

      }).apply(x) as tf.SymbolicTensor;

    x =
      tf.layers.dropout({

        rate: 0.25,

      }).apply(x) as tf.SymbolicTensor;

    x =
      tf.layers.dense({

        units: 128,

        activation: 'relu',

      }).apply(x) as tf.SymbolicTensor;

    const output =
      tf.layers.dense({

        units: vocabularySize,

        activation: 'softmax',

      }).apply(x) as tf.SymbolicTensor;

    const model =
      tf.model({

        inputs: input,

        outputs: output,

      });

    model.compile({

      optimizer: tf.train.adam(),

      loss: 'categoricalCrossentropy',

      metrics: ['accuracy'],

    });

    return model;

  }

}