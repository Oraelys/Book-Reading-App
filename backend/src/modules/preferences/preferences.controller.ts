import{
Controller,
Get,
Param,
Post,
}from'@nestjs/common';

import{PreferencesService}from'./preferences.service';

@Controller('preferences')
export class PreferencesController{

constructor(

private readonly preferences:PreferencesService,

){}

@Get(':userId')

get(

@Param('userId')

userId:string,

){

return this.preferences.get(userId);

}

@Post('rebuild/:userId')

rebuild(

@Param('userId')

userId:string,

){

return this.preferences.rebuild(userId);

}

}