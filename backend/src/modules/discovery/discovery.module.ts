import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';

import { NovelsModule } from '../novels/novels.module';

import { SeriesModule } from '../series/series.module';

import { DiscoveryController } from './discovery.controller';

import { DiscoveryService } from './discovery.service';

@Module({

    imports:[
        DatabaseModule,
        NovelsModule,
        SeriesModule,
    ],

    controllers:[
        DiscoveryController,
    ],

    providers:[
        DiscoveryService,
    ],

    exports:[
        DiscoveryService,
    ]

})
export class DiscoveryModule {}