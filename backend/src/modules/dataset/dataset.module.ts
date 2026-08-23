import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { FeaturesModule } from '../features/features.module';
import { PreferencesModule } from '../preferences/preferences.module';

import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';

@Module({

    imports:[
        DatabaseModule,
        FeaturesModule,
        PreferencesModule,
    ],

    controllers:[
        DatasetController,
    ],

    providers:[
        DatasetService,
    ],

    exports:[
        DatasetService,
    ],

})
export class DatasetModule{}