import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DatasetModule } from '../dataset/dataset.module';


import { TrainingController } from './training.controller';
import { TrainingService } from './training.service';

import { DatasetExportService } from './providers/dataset-export.service';
import { ModelTrainerService } from './providers/model-trainer.service';
import { ModelEvaluatorService } from './providers/model-evaluator.service';
import { ModelStorageService } from './providers/model-storage.service';
import { TensorflowTrainerService } from './providers/tensorflow-trainer.service';
import { DatasetNormalizerService } from './providers/dataset-normalizer.service';
import { TensorBuilderService } from './providers/tensor-builder.service';
import { FeatureScalerService } from './providers/feature-scaler.service';
import { DatasetSplitService } from './providers/dataset-split.service';
import { ModelPredictionService } from './providers/model-prediction.service';
import { ModelCheckpointService } from './providers/model-checkpoint.service';
import { TrainingProgressService } from './providers/training-progress.service';
import { TrainingQueueService } from './providers/training-queue.service';
import { IncrementalTrainingService } from './providers/incremental-training.service';

@Module({
  imports: [
    DatabaseModule,
    DatasetModule,

  ],

  controllers: [
    TrainingController,
  ],

  providers: [
    TrainingService,
    DatasetExportService,
    DatasetNormalizerService,
    DatasetSplitService,
    FeatureScalerService,
    TensorBuilderService,
    TensorflowTrainerService,
    ModelTrainerService,
    ModelEvaluatorService,
    ModelStorageService,
    ModelPredictionService,
    ModelCheckpointService,
    TrainingProgressService,
    TrainingQueueService,
    IncrementalTrainingService,

  ],

  exports: [
    TrainingService,
  ],
})
export class TrainingModule {}