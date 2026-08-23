import { Injectable } from '@nestjs/common';

import { FeaturesService } from '../features/features.service';

import { InferenceService } from './providers/inference.service';

@Injectable()
export class AiService{

constructor(

private readonly features:

FeaturesService,

private readonly inference:

InferenceService,

){}

async score(

userId:string,

novelId:string,

){

const user=

await this.features.get(

'user',

userId,

);

const novel=

await this.features.get(

'novel',

novelId,

);

if(!user||!novel){

return 0;

}

return this.inference.predict([

...user.features,

...novel.features,

]);

}

}