import { Injectable } from '@nestjs/common';

@Injectable()
export class SequenceEncoderService {

  private readonly ids =

    new Map<string, number>();

  encode(

    sequence: string[],

  ) {

    return sequence.map(

      id => {

        if (

          !this.ids.has(id)

        ) {

          this.ids.set(

            id,

            this.ids.size + 1,

          );

        }

        return this.ids.get(id)!;

      },

    );

  }

}