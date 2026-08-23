import {
  Injectable,
} from '@nestjs/common';
import { SupabaseService } from 'src/modules/database/supabase.service';

@Injectable()
export class ModelStorageService {
    constructor(
    private readonly database: SupabaseService,
) {}

  private latestModel: any;

  /*
   * =====================================
   * Save Model
   * =====================================
   */

  async save(
    model: any,
    metrics: any,
  ) {

    const version =
      `v${Date.now()}`;

    this.latestModel = {

      version,

      model,

      metrics,

      savedAt: new Date(),

    };
    await this.database
  .getClient()
  .from('ai_models')
  .insert({

    version,

    accuracy: metrics.accuracy,

    precision: metrics.precision,

    recall: metrics.recall,

    loss: metrics.loss,

    epochs: metrics.epochs,

    samples: metrics.samples,

  });

    return version;

  }

  /*
   * =====================================
   * Latest Model
   * =====================================
   */

  latest() {

    return this.latestModel;

  }

}