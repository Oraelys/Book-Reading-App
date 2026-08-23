import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { PreferencesModule } from '../preferences/preferences.module';

import { FeaturesController } from './features.controller';
import { FeaturesService } from './features.service';

@Module({

    imports:[
        DatabaseModule,
        PreferencesModule,
    ],

    controllers:[
        FeaturesController,
    ],

    providers:[
        FeaturesService,
    ],

    exports:[
        FeaturesService,
    ],

})
export class FeaturesModule{}