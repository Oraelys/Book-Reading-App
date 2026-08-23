import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class TwoTowerModelService {

  build(
    userFeatureCount: number,
    novelFeatureCount: number,
  ): tf.LayersModel {

    /*
     * ----------------------------
     * User Tower
     * ----------------------------
     */

    const userInput = tf.input({
      shape: [userFeatureCount],
      name: 'user_input',
    });

    let userTower = tf.layers.dense({
      units: 128,
      activation: 'relu',
    }).apply(userInput) as tf.SymbolicTensor;

    userTower = tf.layers.dropout({
      rate: 0.3,
    }).apply(userTower) as tf.SymbolicTensor;

    userTower = tf.layers.dense({
      units: 64,
      activation: 'relu',
    }).apply(userTower) as tf.SymbolicTensor;

    /*
     * ----------------------------
     * Story Tower
     * ----------------------------
     */

    const novelInput = tf.input({
      shape: [novelFeatureCount],
      name: 'novel_input',
    });

    let novelTower = tf.layers.dense({
      units: 128,
      activation: 'relu',
    }).apply(novelInput) as tf.SymbolicTensor;

    novelTower = tf.layers.dropout({
      rate: 0.3,
    }).apply(novelTower) as tf.SymbolicTensor;

    novelTower = tf.layers.dense({
      units: 64,
      activation: 'relu',
    }).apply(novelTower) as tf.SymbolicTensor;

    /*
     * Merge
     */

    const merged =
      tf.layers.concatenate().apply([
        userTower,
        novelTower,
      ]) as tf.SymbolicTensor;

    let output =
      tf.layers.dense({
        units: 64,
        activation: 'relu',
      }).apply(merged) as tf.SymbolicTensor;

    output =
      tf.layers.dense({
        units: 1,
        activation: 'sigmoid',
      }).apply(output) as tf.SymbolicTensor;

    const model =
      tf.model({

        inputs: [
          userInput,
          novelInput,
        ],

        outputs: output,

      });

    model.compile({

      optimizer: tf.train.adam(0.001),

      loss: 'binaryCrossentropy',

      metrics: [
        'accuracy',
      ],

    });

    return model;

  }

}