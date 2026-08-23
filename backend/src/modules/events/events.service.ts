import { Injectable } from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

import { PlatformEvent } from './interfaces/event.interface';


@Injectable()
export class EventsService {

    constructor(

        private readonly analytics:AnalyticsService,
        private readonly notifications:NotificationsService,
    ){}

    async dispatch(event:PlatformEvent){

        /*
         * Analytics
         */

        await this.analytics.track({

            userId:event.userId!,

            novelId:event.novelId,

            chapterId:event.chapterId,

            event:event.type as any,

            metadata:event.metadata,

        });

        /*
         * Notifications
         */

        switch(event.type){

            case 'chapter_published':

                if(event.recipientId){

                    await this.notifications.create({

                        recipientId:event.recipientId,

                        type:'new_chapter',

                        title:'New Chapter',

                        message:'A new chapter has been published.',

                        referenceId:event.chapterId,

                        referenceType:'chapter',

                    });

                }

                break;

            case 'comment_created':

                if(event.recipientId){

                    await this.notifications.create({

                        recipientId:event.recipientId,

                        type:'comment',

                        title:'New Comment',

                        message:'Someone commented on your story.',

                        referenceId:event.commentId,

                        referenceType:'comment',

                    });

                }

                break;

        }

        /*
         * Future Modules
         */

        // discovery

        // recommendations

        // achievements

        // ai moderation

        // badges

        // search ranking

    }

    

}