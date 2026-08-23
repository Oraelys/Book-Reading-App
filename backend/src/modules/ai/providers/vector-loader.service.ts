import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

import { VectorIndexService } from './vector-index.service';

@Injectable()
export class VectorLoaderService {

  constructor(

    private readonly database: SupabaseService,

    private readonly index: VectorIndexService,

  ) {}

  async load() {

    const supabase =
      this.database.getClient();

    /*
     * Users
     */

    const {

      data: users,

    } = await supabase

      .from('user_embeddings')

      .select('*');

    users?.forEach(user => {

      this.index.addUser(

        user.user_id,

        user.embedding,

      );

    });

    /*
     * Stories
     */

    const {

      data: novels,

    } = await supabase

      .from('novel_embeddings')

      .select('*');

    novels?.forEach(novel => {

      this.index.addNovel(

        novel.novel_id,

        novel.embedding,

      );

    });

  }

}