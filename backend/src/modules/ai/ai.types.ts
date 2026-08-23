export interface RecommendationRequest {

    userId: string;

    candidateNovelIds: string[];

}

export interface Prediction {

    novelId: string;

    score: number;

}