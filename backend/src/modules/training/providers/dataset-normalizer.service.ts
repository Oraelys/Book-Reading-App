import { Injectable } from '@nestjs/common';

@Injectable()
export class DatasetNormalizerService {

  normalize(dataset: any[]) {

    return dataset.map(item => ({

      features: [

        item.views,

        item.likes,

        item.comments,

        item.rating,

        item.readTime,

        item.completion,

        item.favorites,

      ],

      label: item.clicked,

    }));

  }

}