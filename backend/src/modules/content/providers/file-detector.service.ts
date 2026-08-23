import { Injectable } from '@nestjs/common';

import * as path from 'path';

@Injectable()

export class FileDetectorService{

    detect(

        file:string,

    ){

        return path

            .extname(file)

            .toLowerCase()

            .replace('.','');

    }

}