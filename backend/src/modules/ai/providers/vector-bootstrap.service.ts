import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import { VectorLoaderService } from './vector-loader.service';

@Injectable()
export class VectorBootstrapService
  implements OnModuleInit {

  constructor(

    private readonly loader: VectorLoaderService,

  ) {}

  async onModuleInit() {

    await this.loader.load();

    console.log(
      'Vector index loaded.',
    );

  }

}