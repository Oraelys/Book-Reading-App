import { Injectable } from '@nestjs/common';

@Injectable()
export class ModelHealthService {

status(){

return{

healthy:true,

accuracy:0.94,

lastTraining:new Date(),

};

}

}