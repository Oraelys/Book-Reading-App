import { Injectable } from '@nestjs/common';

@Injectable()
export class FeedForwardNetworkService {

  transform(
    vector: number[],
  ) {

    return vector.map(value =>

      Math.max(0, value),

    );

  }

}