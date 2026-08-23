import { Injectable } from '@nestjs/common';

@Injectable()
export class ModelRegistryService {

private activeVersion='';

setActive(version:string){

this.activeVersion=version;

}

getActive(){

return this.activeVersion;

}

}