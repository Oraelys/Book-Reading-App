import { Injectable } from '@nestjs/common';

import { ScaledDotProductService } from './scaled-dot-product.service';

@Injectable()
export class MultiHeadAttentionService {

  constructor(

    private readonly attention:
      ScaledDotProductService,

  ) {}

  apply(

    queries: number[][],

    keys: number[][],

    values: number[][],

  ) {

    return queries.map(query =>

      this.attention.attention(

        query,

        keys,

        values,

      ),

    );

  }

}