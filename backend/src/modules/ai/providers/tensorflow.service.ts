import { Injectable } from '@nestjs/common';

import * as tf from '@tensorflow/tfjs';

@Injectable()
export class TensorflowService {

    private model?: tf.LayersModel;

    /*
     * ==========================
     * Load Saved Model
     * ==========================
     */

    async load() {

        this.model =

        await tf.loadLayersModel(

            'file://src/modules/ai/models/saved/model.json',

        );

    }

    /*
     * ==========================
     * Loaded?
     * ==========================
     */

    isLoaded() {

        return !!this.model;

    }

    /*
     * ==========================
     * Predict
     * ==========================
     */

    predict(

        features: number[],

    ) {

        if (!this.model) {

            throw new Error(

                'TensorFlow model not loaded.',

            );

        }

        const tensor =

        tf.tensor2d([features]);

        const prediction =

        this.model.predict(

            tensor,

        ) as tf.Tensor;

        return prediction.dataSync()[0];

    }

}