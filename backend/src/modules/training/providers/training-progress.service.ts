import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TrainingProgressService {

  private readonly logger =
    new Logger(TrainingProgressService.name);

  report(
    epoch: number,
    logs?: any,
  ) {

    this.logger.log(
      `Epoch ${epoch + 1}
Loss=${logs?.loss}
Accuracy=${logs?.acc ?? logs?.accuracy}
ValLoss=${logs?.val_loss}
ValAccuracy=${logs?.val_acc ?? logs?.val_accuracy}`,
    );

  }

}