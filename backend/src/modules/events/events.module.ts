import { Module } from '@nestjs/common';

import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { EventsService } from './events.service';

@Module({

    imports:[
        AnalyticsModule,
        NotificationsModule,
    ],

    providers:[
        EventsService,
    ],

    exports:[
        EventsService,
    ],

})
export class EventsModule{}