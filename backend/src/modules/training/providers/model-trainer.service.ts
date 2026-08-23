import { Injectable } from '@nestjs/common';

import * as tf from '@tensorflow/tfjs';

import { TensorflowTrainerService } from './tensorflow-trainer.service';
import { DatasetNormalizerService } from './dataset-normalizer.service';
import { FeatureScalerService } from './feature-scaler.service';
import { DatasetSplitService } from './dataset-split.service';
import { TensorBuilderService } from './tensor-builder.service';
import { TrainingProgressService } from './training-progress.service';
import { ModelCheckpointService } from './model-checkpoint.service';

@Injectable()
export class ModelTrainerService {

  constructor(

    private readonly tensorflow: TensorflowTrainerService,

    private readonly normalizer: DatasetNormalizerService,

    private readonly scaler: FeatureScalerService,

    private readonly splitter: DatasetSplitService,

    private readonly tensors: TensorBuilderService,

    private readonly progress: TrainingProgressService,

    private readonly checkpoint: ModelCheckpointService,

  ) {}

  async train(rawDataset: any[]) {

    const normalized =
      this.normalizer.normalize(rawDataset);

    const scaled =
      this.scaler.scale(normalized);

    const {
      train,
      test,
    } = this.splitter.split(scaled);

    const {
      xs,
      ys,
    } = this.tensors.build(train);

    const {
      xs: testXs,
      ys: testYs,
    } = this.tensors.build(test);

   if (train.length === 0) {
  throw new Error(
    'Training dataset is empty.',
  );
}

const inputFeatures =
  train[0].features.length;

const model =
  this.tensorflow.buildModel(
    inputFeatures,
  );

    this.checkpoint.reset();

  let bestWeights: tf.Tensor[] = [];
    let patience = 0;

    let bestLoss =
      Number.MAX_VALUE;

    const history =
      await model.fit(
        xs,
        ys,
        {

          epochs: 50,

          batchSize: 64,

          shuffle: true,

          validationData: [
            testXs,
            testYs,
          ],

          callbacks: {

            onEpochEnd: async (
              epoch,
              logs,
            ) => {

              this.progress.report(
                epoch,
                logs,
              );

              /*
               * Early Stopping
               */

              if (
                logs &&
                logs.val_loss! <
                  bestLoss
              ) {

                bestLoss =
                  logs.val_loss!;

                patience = 0;

               if (bestWeights.length > 0) {

  bestWeights.forEach(w => w.dispose());

}
                bestWeights =
                  model
                    .getWeights()
                    .map(w =>
                      w.clone(),
                    );

              } else {

                patience++;

              }

              /*
               * Stop after
               * 5 bad epochs
               */

              if (
                patience >= 5
              ) {

                model.stopTraining =
                  true;

              }

            },

          },

        },
      );

    /*
     * Restore Best Model
     */

    if (bestWeights.length > 0) {

  model.setWeights(bestWeights);

  bestWeights.forEach(w => w.dispose());

}

    xs.dispose();
    ys.dispose();

    testXs.dispose();
    testYs.dispose();

    return {

      model,

      history,

      epochs:
        history.epoch.length,

      trainingSamples:
        train.length,

      validationSamples:
        test.length,

    };

  }

}