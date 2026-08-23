import {
Controller,
Get,
Param,
Post,
} from '@nestjs/common';

import { FeaturesService } from './features.service';

@Controller('features')
export class FeaturesController{

constructor(

private readonly features:FeaturesService,

){}

@Post('user/:id')

buildUser(

@Param('id')

id:string,

){

return this.features.buildUserVector(id);

}

@Post('novel/:id')

buildNovel(

@Param('id')

id:string,

){

return this.features.buildNovelVector(id);

}

@Get(':type/:id')

get(

@Param('type')

type:string,

@Param('id')

id:string,

){

return this.features.get(type,id);

}

}