import { Injectable } from '@nestjs/common';

import { DatasetExportService } from './providers/dataset-export.service';
import { ModelTrainerService } from './providers/model-trainer.service';
import { ModelEvaluatorService } from './providers/model-evaluator.service';
import { ModelStorageService } from './providers/model-storage.service';
import { IncrementalTrainingService } from './providers/incremental-training.service';
import { TrainingQueueService } from './providers/training-queue.service';

@Injectable()
export class TrainingService {

  constructor(

    private readonly exporter: DatasetExportService,
    private readonly trainer: ModelTrainerService,
    private readonly evaluator: ModelEvaluatorService,
    private readonly storage: ModelStorageService,
    private readonly queue: TrainingQueueService,
    private readonly incremental: IncrementalTrainingService,

  ) {}

  /*
   * =====================================
   * Train AI
   * =====================================
   */

  async train() {
    

    

    const start = Date.now();

    const dataset =
    await this.exporter.exportDataset();

    const model =
      await this.trainer.train(
        dataset,
      );

    const metrics =
      await this.evaluator.evaluate(
        model,
        dataset,
      );

    metrics.duration =
      Date.now() - start;

    const version =
      await this.storage.save(
        model,
        metrics,
      );

      await model.model.save(

'downloads://recommendation-model',

);

    return {
      success: true,
      version,
      metrics,

    };

  }


  /*
   * =====================================
   * Latest Model
   * =====================================
   */

  status() {

    return this.storage.latest();

  }


  /*
 * =====================================
 * Queue User For Training
 * =====================================
 */

async enqueue(
  userId: string,
) {
  this.queue.enqueue(userId);

  return {
    queued: true,
    userId,
    queueSize: this.queue.size(),
  };
}


/*
 * =====================================
 * Process Queue
 * =====================================
 */

async processQueue() {

  while (this.queue.hasItems()) {

    const userId =
      this.queue.dequeue();

    if (userId) {

      await this.incremental.train(
        userId,
      );

    }

  }

}

}