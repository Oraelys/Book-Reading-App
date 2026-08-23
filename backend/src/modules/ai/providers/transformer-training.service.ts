import { Injectable } from '@nestjs/common';

import { TransformerModelService } from './transformer-model.service';

import { SequenceTensorBuilderService } from './sequence-tensor-builder.service';

@Injectable()
export class TransformerTrainingService {

  constructor(

    private readonly modelBuilder:
      TransformerModelService,

    private readonly tensors:
      SequenceTensorBuilderService,

  ) {}

  async train(

    dataset: {

      input: number[];

      output: number[];

    }[],

    sequenceLength: number,

    embeddingSize: number,

    vocabularySize: number,

  ) {

    const {

      xs,

      ys,

    } = this.tensors.build(
      dataset,
    );

    const model =
      this.modelBuilder.build(

        sequenceLength,

        embeddingSize,

        vocabularySize,

      );

    await model.fit(

      xs,

      ys,

      {

        epochs: 20,

        batchSize: 128,

        shuffle: true,

      },

    );

    xs.dispose();
    ys.dispose();

    return model;

  }

}