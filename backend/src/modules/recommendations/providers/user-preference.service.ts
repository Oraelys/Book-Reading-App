import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class UserPreferenceService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * =====================================
   * Load Preference Vector
   * =====================================
   */

  async get(userId: string) {
    const { data } =
      await this.database
        .getClient()
        .from('user_preference_vectors')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    return data;
  }

  /*
   * =====================================
   * Save Preference Vector
   * =====================================
   */

  async save(
    userId: string,
    vector: number[],
  ) {
    const supabase =
      this.database.getClient();

    await supabase
      .from('user_preference_vectors')
      .upsert({
        user_id: userId,
        vector,
      });

    return true;
  }
}