import { Injectable } from '@nestjs/common';

@Injectable()
export class ModelEvaluatorService {

  /*
   * =====================================
   * Evaluate Model
   * =====================================
   */

  async evaluate(
    model: any,
    dataset: any[],
  ) {

    /*
     * Placeholder metrics.
     * TensorFlow will produce
     * real metrics later.
     */

    return {

      accuracy: 0.91,

      precision: 0.89,

      recall: 0.87,

      loss: 0.08,

      epochs: model.epochs,

      samples: dataset.length,

      duration: 0,

    };

  }

}