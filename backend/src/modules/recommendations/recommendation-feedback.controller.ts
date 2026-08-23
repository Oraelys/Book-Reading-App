import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from '@nestjs/common';

import { RecommendationFeedbackService } from './recommendation-feedback.service';

import { CreateRecommendationFeedbackDto } from './dto/create-feedback.dto';

@Controller(
    'recommendations/feedback',
)
export class RecommendationFeedbackController {

    constructor(

        private readonly feedbackService:
            RecommendationFeedbackService,

    ) {}

    @Post()
    record(

        @Body()
        dto: CreateRecommendationFeedbackDto,

    ) {

        return this.feedbackService.record(dto);

    }

    @Get(':userId')
    history(

        @Param('userId')
        userId: string,

    ) {

        return this.feedbackService.history(userId);

    }

}