import { Injectable } from '@nestjs/common';

@Injectable()
export class ResidualConnectionService {

  apply(
    input: number[],
    output: number[],
  ): number[] {

    return input.map(
      (value, index) => value + (output[index] ?? 0),
    );

  }

}