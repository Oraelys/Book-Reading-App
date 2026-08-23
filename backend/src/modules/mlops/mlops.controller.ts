import {
Controller,
Post,
} from '@nestjs/common';

import { MlopsService } from './mlops.service';

@Controller('mlops')
export class MlopsController{

constructor(

private readonly mlops:MlopsService,

){}

@Post('retrain')

retrain(){

return this.mlops.retrain();

}

}