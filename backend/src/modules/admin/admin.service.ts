
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly database: SupabaseService) {}

  async getDashboardOverview() {
    const supabase = this.database.getClient();

    const [
      usersResult,
      novelsResult,
      chaptersResult,
      publishedChaptersResult,
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('novels')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('is_published', true),
    ]);

    const countQueries = [
      { name: 'profiles count', result: usersResult },
      { name: 'novels count', result: novelsResult },
      { name: 'chapters count', result: chaptersResult },
      {
        name: 'published chapters count',
        result: publishedChaptersResult,
      },
    ];

    for (const query of countQueries) {
      if (query.result.error) {
        this.logger.error(
          `Dashboard ${query.name} query failed: ` +
            `${query.result.error.message} ` +
            `(code: ${query.result.error.code ?? 'unknown'})`,
        );

        throw new InternalServerErrorException(
          'Unable to load the admin dashboard totals.',
        );
      }
    }

    let recentActivity: Array<{
      id: string;
      user_id: string | null;
      activity_type: string | null;
      novel_id: string | null;
      chapter_id: string | null;
      created_at: string | null;
    }> = [];

    try {
      const activityResult = await supabase
        .from('user_activity_logs')
        .select(
          'id, user_id, activity_type, novel_id, chapter_id, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityResult.error) {
        this.logger.warn(
          'Dashboard recent activity query failed: ' +
            `${activityResult.error.message} ` +
            `(code: ${activityResult.error.code ?? 'unknown'}). ` +
            'Returning dashboard totals without recent activity.',
        );
      } else {
        recentActivity = (activityResult.data ?? []) as typeof recentActivity;
      }
    } catch (error) {
      this.logger.error(
        'Dashboard recent activity query threw an exception: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }

    return {
      totals: {
        users: usersResult.count ?? 0,
        novels: novelsResult.count ?? 0,
        chapters: chaptersResult.count ?? 0,
        publishedChapters: publishedChaptersResult.count ?? 0,
      },
      recentActivity,
      generatedAt: new Date().toISOString(),
    };
  }
}