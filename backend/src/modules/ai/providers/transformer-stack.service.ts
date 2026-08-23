import { Injectable } from '@nestjs/common';

import { TransformerEncoderBlockService } from './transformer-encoder-block.service';

@Injectable()
export class TransformerStackService {

  constructor(

    private readonly encoder:

      TransformerEncoderBlockService,

  ) {}

  encode(

    sequence: number[][],

    layers = 4,

  ): number[][] {

    let output = sequence;

    for (

      let i = 0;

      i < layers;

      i++

    ) {

      output =

        this.encoder.encode(output);

    }

    return output;

  }

}