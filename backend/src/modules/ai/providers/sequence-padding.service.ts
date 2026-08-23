import { Injectable } from '@nestjs/common';

@Injectable()
export class SequencePaddingService {

  pad(
    sequence: number[],
    maxLength: number,
  ) {

    if (
      sequence.length >= maxLength
    ) {

      return sequence.slice(
        sequence.length - maxLength,
      );

    }

    return [

      ...Array(
        maxLength -
          sequence.length,
      ).fill(0),

      ...sequence,

    ];

  }

}