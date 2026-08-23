import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { CreateRecommendationFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class RecommendationFeedbackService {

    constructor(

        private readonly database: SupabaseService,

    ) {}

    async record(
        dto: CreateRecommendationFeedbackDto,
    ) {

        const { data, error } =
            await this.database
                .getClient()
                .from('recommendation_feedback')
                .insert({

                    user_id: dto.userId,

                    novel_id: dto.novelId,

                    recommendation_type:
                        dto.recommendationType,

                    action: dto.action,

                    score: dto.score ?? 0,

                    metadata:
                        dto.metadata ?? {},

                })
                .select()
                .single();

        if (error)
            throw error;

        return data;

    }

    async history(
        userId: string,
    ) {

        const { data, error } =
            await this.database
                .getClient()
                .from('recommendation_feedback')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', {
                    ascending: false,
                });

        if (error)
            throw error;

        return data;

    }

}