import { Injectable } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';

@Injectable()
export class ModelCacheService {

  private model: tf.LayersModel | null = null;

  setModel(model: tf.LayersModel) {
    this.model = model;
  }

  getModel(): tf.LayersModel {

    if (!this.model) {
      throw new Error(
        'AI model has not been loaded.',
      );
    }

    return this.model;
  }

  hasModel() {
    return this.model !== null;
  }

  clear() {

    if (this.model) {
      this.model.dispose();
    }

    this.model = null;

  }

}