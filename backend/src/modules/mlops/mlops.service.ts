import { Injectable } from '@nestjs/common';

import { TrainingService } from '../training/training.service';

@Injectable()
export class MlopsService {

    constructor(

        private readonly training:TrainingService,

    ){}

    async retrain(){

        return this.training.train();

    }

}