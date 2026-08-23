import { Injectable } from '@nestjs/common';

import { TensorflowService } from './tensorflow.service';

@Injectable()
export class ModelLoaderService {

    constructor(

        private readonly tensorflow: TensorflowService,

    ) {}

    async load() {

        try {

            await this.tensorflow.load();

        } catch {

            /*
             * Ignore.
             * Hybrid algorithm remains active.
             */

        }

    }

    isLoaded() {

        return this.tensorflow.isLoaded();

    }

}