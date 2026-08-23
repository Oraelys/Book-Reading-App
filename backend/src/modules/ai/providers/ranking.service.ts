import { Injectable } from '@nestjs/common';

@Injectable()
export class RankingService {

  rank(items: any[]) {

    return items.sort(

      (a, b) =>

        b.aiScore - a.aiScore,

    );

  }

}