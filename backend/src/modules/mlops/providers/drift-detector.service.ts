import { Injectable } from '@nestjs/common';

@Injectable()
export class DriftDetectorService {

detect(){

return{

drift:false,

score:0.02,

};

}

}