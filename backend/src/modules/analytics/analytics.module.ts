import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DiscoveryModule } from '../discovery/discovery.module';

import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({

    imports:[
        DatabaseModule,
        DiscoveryModule,
    ],

    controllers:[
        AnalyticsController,
    ],

    providers:[
        AnalyticsService,
    ],

    exports:[
        AnalyticsService,
    ],

})
export class AnalyticsModule{}