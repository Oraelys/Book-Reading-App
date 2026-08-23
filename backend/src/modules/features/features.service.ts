import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { PreferencesService } from '../preferences/preferences.service';

@Injectable()
export class FeaturesService {

    constructor(

        private readonly database:SupabaseService,

        private readonly preferences:PreferencesService,

    ){}

    /*
     * =====================================
     * User Vector
     * =====================================
     */

    async buildUserVector(

        userId:string,

    ){

        const profile=

        await this.preferences.get(userId);

        if(!profile){

            await this.preferences.rebuild(userId);

        }

        const updated=

        await this.preferences.get(userId);

                const vector=[

            updated.books_started,

            updated.books_completed,

            updated.average_completion_rate,

            updated.engagement_score,

            updated.favorite_categories.length,

            updated.favorite_authors.length,

            updated.favorite_tags.length,

            updated.favorite_series.length,

            updated.average_words_per_session,

            updated.average_session_duration,

        ];

        return this.save(

            'user',

            userId,

            vector,

        );

    }

        /*
     * =====================================
     * Novel Vector
     * =====================================
     */

    async buildNovelVector(

        novelId:string,

    ){

        const {data,error}=

        await this.database

        .getClient()

        .from('novels')

        .select('*')

        .eq('id',novelId)

        .single();

        if(error) throw error;

        const vector=[

            data.views,

            data.total_readers,

            data.total_ratings,

            data.rating,

            data.word_count,

            data.chapter_count,

            data.popularity_score,

            data.trending_score,

            data.completion_rate,

        ];

        return this.save(

            'novel',

            novelId,

            vector,

        );

    }
        /*
     * =====================================
     * Save Vector
     * =====================================
     */

    private async save(

        type:string,

        id:string,

        vector:number[],

    ){

        const payload={

            entity_type:type,

            entity_id:id,

            features:vector,

            updated_at:new Date(),

        };

        const {data,error}=

        await this.database

        .getClient()

        .from('feature_vectors')

        .upsert(payload)

        .select()

        .single();

        if(error) throw error;

        return data;

    }

    async get(

        type:string,

        id:string,

    ){

        const {data,error}=

        await this.database

        .getClient()

        .from('feature_vectors')

        .select('*')

        .eq('entity_type',type)

        .eq('entity_id',id)

        .maybeSingle();

        if(error) throw error;

        return data;

    }

}