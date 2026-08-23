import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';

import { TrainingModule } from '../training/training.module';

import { MlopsController } from './mlops.controller';
import { MlopsService } from './mlops.service';

import { SchedulerService } from './providers/scheduler.service';
import { ModelRegistryService } from './providers/model-registry.service';
import { DriftDetectorService } from './providers/drift-detector.service';
import { ModelHealthService } from './providers/model-health.service';

@Module({

    imports:[
        ScheduleModule,
        TrainingModule,
    ],

    controllers:[
        MlopsController,
    ],

    providers:[
        MlopsService,
        SchedulerService,
        ModelRegistryService,
        DriftDetectorService,
        ModelHealthService,
    ],

    exports:[
        MlopsService,
    ],

})
export class MlopsModule{}