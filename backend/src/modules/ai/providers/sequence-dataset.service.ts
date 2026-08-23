import { Injectable } from '@nestjs/common';

@Injectable()
export class SequenceDatasetService {

  build(

    sessions: any[],

  ) {

    const dataset: {

      input: string[];

      output: string;

    }[] = [];

    for (const session of sessions) {

      const novels =

        session.map(

          (x: any) => x.novel_id,

        );

      for (

        let i = 1;

        i < novels.length;

        i++

      ) {

        dataset.push({

          input:

            novels.slice(

              0,

              i,

            ),

          output:

            novels[i],

        });

      }

    }

    return dataset;

  }

}