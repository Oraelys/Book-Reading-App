import { Injectable } from '@nestjs/common';

import { MultiHeadAttentionService } from './multi-head-attention.service';
import { FeedForwardNetworkService } from './feed-forward-network.service';
import { LayerNormalizationService } from './layer-normalization.service';
import { ResidualConnectionService } from './residual-connection.service';

@Injectable()
export class TransformerEncoderBlockService {

  constructor(

    private readonly attention: MultiHeadAttentionService,

    private readonly feedForward: FeedForwardNetworkService,

    private readonly normalization: LayerNormalizationService,

    private readonly residual: ResidualConnectionService,

  ) {}

  encode(sequence: number[][]): number[][] {

    /*
     * Self Attention
     */

    const attentionOutput =
      this.attention.apply(

        sequence,

        sequence,

        sequence,

      );

    /*
     * Residual + Normalize
     */

    const normalizedAttention =

      attentionOutput.map((vector, index) =>

        this.normalization.normalize(

          this.residual.apply(

            sequence[index],

            vector,

          ),

        ),

      );

    /*
     * Feed Forward
     */

    const ffOutput =

      normalizedAttention.map(vector =>

        this.feedForward.transform(vector),

      );

    /*
     * Second Residual + Normalize
     */

    return ffOutput.map(

      (vector, index) =>

        this.normalization.normalize(

          this.residual.apply(

            normalizedAttention[index],

            vector,

          ),

        ),

    );

  }

}