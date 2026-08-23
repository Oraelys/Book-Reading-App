import { Injectable } from '@nestjs/common';

@Injectable()
export class PreprocessingService {

    normalize(

        values:number[],

    ){

        const max=Math.max(...values,1);

        return values.map(

            v=>v/max,

        );

    }

}