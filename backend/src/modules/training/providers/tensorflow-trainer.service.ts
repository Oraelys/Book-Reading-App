import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class TensorflowTrainerService {

  /*
   * =====================================
   * Build Neural Network
   * =====================================
   */

  buildModel(inputFeatures: number) {

    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        inputShape: [inputFeatures],
        units: 128,
        activation: 'relu',
      }),
    );

    model.add(
      tf.layers.dropout({
        rate: 0.25,
      }),
    );

    model.add(
      tf.layers.dense({
        units: 64,
        activation: 'relu',
      }),
    );

    model.add(
      tf.layers.dropout({
        rate: 0.20,
      }),
    );

    model.add(
      tf.layers.dense({
        units: 32,
        activation: 'relu',
      }),
    );

    model.add(
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }),
    );

    model.compile({

      optimizer: tf.train.adam(
    0.0005,
),

      loss: 'binaryCrossentropy',

      metrics: ['accuracy'],

    });

    return model;

  }

}