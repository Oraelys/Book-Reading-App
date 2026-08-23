import { Injectable } from '@nestjs/common';

import { VectorEngineService } from './vector-engine.service';

@Injectable()
export class NearestNeighborService {

    constructor(

        private readonly engine:
            VectorEngineService,

    ) {}

    async search(
        embedding: number[],
        limit = 20,
    ) {

        return this.engine
            .engine()
            .search(
                embedding,
                limit,
            );

    }

}