import { Injectable, Logger } from '@nestjs/common';

import { DatasetExportService } from './dataset-export.service';
import { ModelTrainerService } from './model-trainer.service';
import { ModelStorageService } from './model-storage.service';

@Injectable()
export class IncrementalTrainingService {
  private readonly logger =
    new Logger(IncrementalTrainingService.name);

  constructor(
    private readonly exporter: DatasetExportService,
    private readonly trainer: ModelTrainerService,
    private readonly storage: ModelStorageService,
  ) {}

  async train(userId: string) {
    this.logger.log(
      `Incremental training for ${userId}`,
    );

    const dataset =
      await this.exporter.exportUserDataset(
        userId,
      );

    if (dataset.length < 20) {
      return;
    }

    const result =
      await this.trainer.train(dataset);

    await this.storage.save(
      result.model,
      `user-${userId}`,
    );
  }
}