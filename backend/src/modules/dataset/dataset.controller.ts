import {
Controller,
Get,
} from '@nestjs/common';

import { DatasetService } from './dataset.service';

@Controller('dataset')
export class DatasetController{

constructor(

private readonly dataset:DatasetService,

){}

@Get('recommendations')

buildRecommendationDataset(){

return this.dataset.buildRecommendationDataset();

}

@Get('statistics')

statistics(){

return this.dataset.statistics();

}

}