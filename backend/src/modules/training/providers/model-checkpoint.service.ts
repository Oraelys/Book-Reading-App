import { Injectable } from '@nestjs/common';

@Injectable()
export class ModelCheckpointService {

  private bestValidation = 0;

  shouldSave(
    validationAccuracy: number,
  ) {

    if (
      validationAccuracy >
      this.bestValidation
    ) {

      this.bestValidation =
        validationAccuracy;

      return true;

    }

    return false;

  }

  reset() {

    this.bestValidation = 0;

  }

}