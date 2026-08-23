import {
Controller,
Post,
Get,
} from '@nestjs/common';

import { TrainingService } from './training.service';

@Controller('training')
export class TrainingController{

constructor(

private readonly training:TrainingService,

){}

@Post('train')

train(){

return this.training.train();

}

@Get('status')

status(){

return this.training.status();

}

}