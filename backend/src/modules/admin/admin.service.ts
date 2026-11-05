
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

import { SupabaseService } from '../database/supabase.service';

export interface AdminUser {
  id: string;
  username: string | null;
  user_tag: string | null;
  email: string | null;
  role: 'reader' | 'author' | 'admin';
  is_public: boolean | null;
  created_at: string | null;
  avatar_url: string | null;
  account_status: 'active' | 'suspended';
  suspended_at: string | null;
  suspension_reason: string | null;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
}

export interface RecentActivity {
  id: string;
  user_id: string | null;
  activity_type: string | null;
  novel_id: string | null;
  chapter_id: string | null;
  created_at: string | null;
}

export interface AdminDashboardOverview {
  totals: {
    users: number;
    novels: number;
    chapters: number;
    publishedChapters: number;
  };
  recentActivity: RecentActivity[];
  generatedAt: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private readonly database: SupabaseService) {}

  async getDashboardOverview(): Promise<AdminDashboardOverview> {
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

    let recentActivity: RecentActivity[] = [];

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
        recentActivity = (activityResult.data ?? []) as RecentActivity[];
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

  async listUsers(
  search?: string,
  role?: string,
): Promise<AdminUsersResponse> {
  const supabase = this.database.getClient();
  const limit = 100;

  // Remove PostgREST filter syntax characters before building the search.
  const term = (search ?? '')
    .trim()
    .replace(/[,%()\\"']/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 100);

  const allowedRoles = ['reader', 'author', 'admin'];
  const selectedRole =
    role && allowedRoles.includes(role) ? role : undefined;

  let query = supabase
    .from('profiles')
    .select(
      'id, username, user_tag, email, role, is_public, created_at, avatar_url, account_status, suspended_at, suspension_reason',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (selectedRole) {
    query = query.eq('role', selectedRole);
  }

  if (term) {
    const pattern = `%${term}%`;
    query = query.or(
      `username.ilike.${pattern},user_tag.ilike.${pattern},email.ilike.${pattern}`,
    );
  }

  const { data, error, count } = await query;

  if (error) {
    this.logger.error(
      `Admin users query failed: ${error.message} ` +
        `(code: ${error.code ?? 'unknown'})`,
    );

    throw new InternalServerErrorException(
      'Unable to load administrator user records.',
    );
  }

  const users: AdminUser[] = (data ?? []).map((row) => ({
    id: row.id,
    username: row.username ?? null,
    user_tag: row.user_tag ?? null,
    email: row.email ?? null,
    role: allowedRoles.includes(row.role)
      ? (row.role as AdminUser['role'])
      : 'reader',
    is_public:
      typeof row.is_public === 'boolean' ? row.is_public : null,
    created_at: row.created_at ?? null,
    avatar_url: row.avatar_url ?? null,
    account_status: row.account_status === 'suspended' ? 'suspended' : 'active',
    suspended_at: row.suspended_at ?? null,
    suspension_reason: row.suspension_reason ?? null,
  }));

  return {
    users,
    total: count ?? users.length,
    limit,
  };
}

  async changeUserRole(
    actorUserId: string,
    targetUserId: string,
    role: string,
  ): Promise<{ userId: string; previousRole: string; newRole: string; changedAt: string }> {
    const allowedRoles = ['reader', 'author', 'admin'];
    if (!allowedRoles.includes(role)) {
      throw new BadRequestException('Choose a valid user role.');
    }

    const { data, error } = await this.database.getClient().rpc(
      'admin_change_profile_role',
      {
        p_actor_user_id: actorUserId,
        p_target_user_id: targetUserId,
        p_new_role: role,
      },
    );

    if (error) {
      this.logger.error(
        `Admin role change failed: ${error.message} (code: ${error.code ?? 'unknown'})`,
      );
      if (error.code === 'P0002') {
        throw new NotFoundException('The selected user no longer exists.');
      }
      if (error.code === '42501' || error.code === '23514' || error.code === '22023') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException('Unable to update the user role.');
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.user_id !== 'string') {
      throw new InternalServerErrorException('The server returned an invalid role-change response.');
    }

    return {
      userId: row.user_id,
      previousRole: row.previous_role,
      newRole: row.new_role,
      changedAt: row.changed_at,
    };
  }

  async setUserAccountStatus(
    actorUserId: string,
    targetUserId: string,
    status: 'active' | 'suspended',
    reason?: string,
  ): Promise<{
    userId: string;
    previousStatus: 'active' | 'suspended';
    newStatus: 'active' | 'suspended';
    changedAt: string;
  }> {
    if (actorUserId === targetUserId) {
      throw new BadRequestException('You cannot suspend or reactivate your own account.');
    }

    const client = this.database.getClient();
    const banDuration = status === 'suspended' ? '876000h' : 'none';

    // Supabase Auth ban prevents new sign-ins and token refresh. The profile
    // status is also checked by authenticated API guards to reject existing JWTs.
    const authResult = await client.auth.admin.updateUserById(targetUserId, {
      ban_duration: banDuration,
    });

    if (authResult.error) {
      this.logger.error(
        `Supabase Auth account status update failed: ${authResult.error.message}`,
      );
      if (authResult.error.message.toLowerCase().includes('not found')) {
        throw new NotFoundException('The selected authentication account was not found.');
      }
      throw new InternalServerErrorException('Unable to update sign-in access for this account.');
    }

    const { data, error } = await client.rpc('admin_set_profile_account_status', {
      p_actor_user_id: actorUserId,
      p_target_user_id: targetUserId,
      p_new_status: status,
      p_reason: reason?.trim().slice(0, 500) || null,
    });

    if (error) {
      // Compensate Auth if the database transaction rejects the status change.
      const rollback = await client.auth.admin.updateUserById(targetUserId, {
        ban_duration: status === 'suspended' ? 'none' : '876000h',
      });
      if (rollback.error) {
        this.logger.error(
          `Account status rollback failed for ${targetUserId}: ${rollback.error.message}`,
        );
      }

      this.logger.error(
        `Admin account status change failed: ${error.message} (code: ${error.code ?? 'unknown'})`,
      );
      if (error.code === 'P0002') {
        throw new NotFoundException('The selected user no longer exists.');
      }
      if (error.code === '42501' || error.code === '23514' || error.code === '22023') {
        throw new BadRequestException(error.message);
      }
      throw new InternalServerErrorException(
        rollback.error
          ? 'The account status update failed and sign-in access may need administrator repair.'
          : 'Unable to update the account status.',
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.user_id !== 'string') {
      throw new InternalServerErrorException('The server returned an invalid account status response.');
    }

    return {
      userId: row.user_id,
      previousStatus: row.previous_status,
      newStatus: row.new_status,
      changedAt: row.changed_at,
    };
  }

}
