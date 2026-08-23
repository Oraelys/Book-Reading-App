import {
Controller,
Get,
Param,
} from '@nestjs/common';

import { AiService } from './ai.service';

@Controller('ai')
export class AiController{

constructor(

private readonly ai:AiService,

){}

@Get(

'score/:userId/:novelId',

)

score(

@Param('userId')

userId:string,

@Param('novelId')

novelId:string,

){

return this.ai.score(

userId,

novelId,

);

}

}