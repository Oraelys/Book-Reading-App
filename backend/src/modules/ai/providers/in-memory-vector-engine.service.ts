import { Injectable } from '@nestjs/common';

import {
    VectorEngine,
    VectorSearchResult,
} from './vector-engine.interface';

import { CosineSimilarityService } from './cosine-similarity.service';

@Injectable()
export class InMemoryVectorEngineService
implements VectorEngine {

    private readonly vectors =
        new Map<string, Float32Array>();

    constructor(

        private readonly cosine:
            CosineSimilarityService,

    ) {}

    async initialize() {}

    async add(
        id: string,
        embedding: number[],
    ) {

        this.vectors.set(
            id,
            Float32Array.from(embedding),
        );

    }

    async update(
        id: string,
        embedding: number[],
    ) {

        await this.add(
            id,
            embedding,
        );

    }

    async remove(
        id: string,
    ) {

        this.vectors.delete(id);

    }

    async search(
        embedding: number[],
        limit = 20,
    ): Promise<VectorSearchResult[]> {

        return [...this.vectors.entries()]

            .map(([id, vector]) => ({

                id,

                score:
                    this.cosine.similarity(
                        embedding,
                        [...vector],
                    ),

            }))

            .sort(
                (a, b) =>
                    b.score - a.score,
            )

            .slice(0, limit);

    }

}