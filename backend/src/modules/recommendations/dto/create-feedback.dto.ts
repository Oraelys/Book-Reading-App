export class CreateRecommendationFeedbackDto {

    userId!: string;

    novelId!: string;

    recommendationType!: string;

    action!:
        | 'shown'
        | 'opened'
        | 'clicked'
        | 'dismissed'
        | 'started'
        | 'completed'
        | 'liked'
        | 'shared';

    score?: number;

    metadata?: Record<string, any>;

}