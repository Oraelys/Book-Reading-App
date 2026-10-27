import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AdminService {
  constructor(private readonly database: SupabaseService) {}

  async getDashboardOverview() {
    const supabase = this.database.getClient();

    const [
      usersResult,
      novelsResult,
      chaptersResult,
      publishedChaptersResult,
      recentActivityResult,
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),

      supabase.from('novels').select('*', { count: 'exact', head: true }),

      supabase.from('chapters').select('*', { count: 'exact', head: true }),

      supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),

      supabase
        .from('user_activity_logs')
        .select('id, user_id, activity_type, novel_id, chapter_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const results = [
      usersResult,
      novelsResult,
      chaptersResult,
      publishedChaptersResult,
      recentActivityResult,
    ];

    if (results.some((result) => result.error)) {
      throw new InternalServerErrorException(
        'Unable to load the admin dashboard data.',
      );
    }

    return {
      totals: {
        users: usersResult.count ?? 0,
        novels: novelsResult.count ?? 0,
        chapters: chaptersResult.count ?? 0,
        publishedChapters: publishedChaptersResult.count ?? 0,
      },
      recentActivity: recentActivityResult.data ?? [],
      generatedAt: new Date().toISOString(),
    };
  }
}
