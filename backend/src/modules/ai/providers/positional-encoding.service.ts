import { Injectable } from '@nestjs/common';

@Injectable()
export class PositionalEncodingService {

  encode(
    sequenceLength: number,
    dimensions: number,
  ): number[][] {

    const encoding: number[][] = [];

    for (let pos = 0; pos < sequenceLength; pos++) {

      const row: number[] = [];

      for (let i = 0; i < dimensions; i++) {

        const angle =
          pos /
          Math.pow(
            10000,
            (2 * Math.floor(i / 2)) / dimensions,
          );

        row.push(
          i % 2 === 0
            ? Math.sin(angle)
            : Math.cos(angle),
        );

      }

      encoding.push(row);

    }

    return encoding;

  }

}