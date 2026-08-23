import { Injectable } from '@nestjs/common';

import { InMemoryVectorEngineService } from './in-memory-vector-engine.service';

@Injectable()
export class VectorEngineService {

    constructor(

        private readonly memory:
            InMemoryVectorEngineService,

    ) {}

    engine() {

        /*
         * Future:
         *
         * pgvector
         * Qdrant
         * Milvus
         * Pinecone
         * Weaviate
         */

        return this.memory;

    }

}