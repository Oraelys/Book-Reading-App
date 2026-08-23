import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

import { TrainingSample } from './interfaces/training-sample.interface';

@Injectable()
export class DatasetService {

    constructor(

        private readonly database:SupabaseService,

    ){}

    /*
     * =====================================
     * Recommendation Dataset
     * =====================================
     */

    async buildRecommendationDataset():

    Promise<TrainingSample[]>{

        const supabase=

        this.database.getClient();

        const {data:feedback}=

        await supabase

        .from('recommendation_feedback')

        .select('*');

        const dataset:TrainingSample[]=[];

                for(const row of feedback??[]){

            const {data:user}=

            await supabase

            .from('feature_vectors')

            .select('*')

            .eq('entity_type','user')

            .eq('entity_id',row.user_id)

            .maybeSingle();

            const {data:novel}=

            await supabase

            .from('feature_vectors')

            .select('*')

            .eq('entity_type','novel')

            .eq('entity_id',row.novel_id)

            .maybeSingle();

            if(!user||!novel){

                continue;

            }

                        dataset.push({

                userId:row.user_id,

                novelId:row.novel_id,

                features:[

                    ...user.features,

                    ...novel.features,

                ],

                label:this.label(row.action),

            });

        }

        return dataset;

    }

        /*
     * =====================================
     * Labels
     * =====================================
     */

    private label(

        action:string,

    ){

        switch(action){

            case 'completed':

                return 1;

            case 'liked':

                return 0.9;

            case 'shared':

                return 0.95;

            case 'started':

                return 0.75;

            case 'opened':

                return 0.5;

            case 'clicked':

                return 0.4;

            case 'shown':

                return 0.2;

            case 'dismissed':

                return 0;

            default:

                return 0;

        }

    }

        /*
     * =====================================
     * Dataset Statistics
     * =====================================
     */

    async statistics(){

        const dataset=

        await this.buildRecommendationDataset();

        return{

            samples:dataset.length,

            featureLength:

            dataset.length

            ?dataset[0].features.length

            :0,

            positive:

            dataset.filter(

                d=>d.label>=0.7,

            ).length,

            negative:

            dataset.filter(

                d=>d.label<0.7,

            ).length,

        };

    }

}