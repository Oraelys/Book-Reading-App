import { Injectable } from '@nestjs/common';

import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class DatasetExportService {
  constructor(
    private readonly database: SupabaseService,
  ) {}

  /*
   * =====================================
   * Full Dataset
   * =====================================
   */

  async exportDataset() {
    const { data, error } =
      await this.database
        .getClient()
        .from('user_activity_logs')
        .select('*')
        .order('created_at', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Single User Dataset
   * =====================================
   */

  async exportUserDataset(
    userId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }

  /*
   * =====================================
   * Novel Dataset
   * =====================================
   */

  async exportNovelDataset(
    novelId: string,
  ) {
    const { data, error } =
      await this.database
        .getClient()
        .from('user_activity_logs')
        .select('*')
        .eq('novel_id', novelId)
        .order('created_at', {
          ascending: true,
        });

    if (error) {
      throw error;
    }

    return data ?? [];
  }
}