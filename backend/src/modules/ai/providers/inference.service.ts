import { Injectable } from '@nestjs/common';

import { PreprocessingService } from './preprocessing.service';
import { TensorflowService } from './tensorflow.service';

@Injectable()
export class InferenceService{

constructor(

private readonly preprocessing:

PreprocessingService,

private readonly tensorflow:

TensorflowService,

){}

predict(

    features:number[],

){

const normalized=

this.preprocessing.normalize(

features,

);

/*
 * TensorFlow available
 */

if(

this.tensorflow.isLoaded()

){

return this.tensorflow.predict(

normalized,

);

}

/*
 * Fallback
 */

return (

normalized.reduce(

(a,b)=>a+b,

0,

)/normalized.length

);

}
}