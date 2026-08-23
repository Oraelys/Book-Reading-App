import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class ModelPredictionService {

  async predict(
    model: tf.LayersModel,
    features: number[],
  ) {

    const tensor =
      tf.tensor2d([features]);

    const prediction =
      model.predict(
        tensor,
      ) as tf.Tensor;

    const value =
      await prediction.data();

    tensor.dispose();
    prediction.dispose();

    return value[0];

  }

}