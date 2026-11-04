
import { AppError } from '../../shared/errors';
import type {
  AdminActivityItem,
  AdminDashboardOverview,
  AdminUserRole,
  AdminUsersResponse,
  AdminRoleChangeResponse,
  AdminUserDetailsResponse,
  AdminUserRoleAuditItem,
} from '../../shared/admin-types';
import type { ApiClient } from './api-client';

type Raw = Record<string, unknown>;

function isRaw(value: unknown): value is Raw {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function count(value: unknown): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new AppError({
      kind: 'unknown',
      message: 'The server returned invalid dashboard totals.',
    });
  }

  return value;
}

function parseActivity(value: unknown): AdminActivityItem {
  if (!isRaw(value) || typeof value.id !== 'string') {
    throw new AppError({
      kind: 'unknown',
      message: 'The server returned invalid activity data.',
    });
  }

  return {
    id: value.id,
    userId: textOrNull(value.user_id),
    activityType: textOrNull(value.activity_type) ?? 'unknown',
    novelId: textOrNull(value.novel_id),
    chapterId: textOrNull(value.chapter_id),
    createdAt: textOrNull(value.created_at),
  };
}

export class AdminApi {
  constructor(private readonly api: ApiClient) {}

  async dashboardOverview(): Promise<AdminDashboardOverview> {
    const raw = await this.api.request({
      method: 'GET',
      path: '/admin/dashboard',
    });

    if (
      !isRaw(raw) ||
      !isRaw(raw.totals) ||
      !Array.isArray(raw.recentActivity) ||
      typeof raw.generatedAt !== 'string'
    ) {
      throw new AppError({
        kind: 'unknown',
        message: 'The server returned an invalid dashboard response.',
      });
    }

    return {
      totals: {
        users: count(raw.totals.users),
        novels: count(raw.totals.novels),
        chapters: count(raw.totals.chapters),
        publishedChapters: count(raw.totals.publishedChapters),
      },
      recentActivity: raw.recentActivity.map(parseActivity),
      generatedAt: raw.generatedAt,
    };
  }

  async listUsers(
  search: string,
  role: AdminUserRole | 'all',
): Promise<AdminUsersResponse> {
  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  if (role !== 'all') {
    params.set('role', role);
  }

  const suffix = params.toString();
  const raw = await this.api.request({
    method: 'GET',
    path: `/admin/users${suffix ? `?${suffix}` : ''}`,
  });

  if (
    !isRaw(raw) ||
    !Array.isArray(raw.users) ||
    typeof raw.total !== 'number' ||
    typeof raw.limit !== 'number'
  ) {
    throw new AppError({
      kind: 'unknown',
      message: 'The server returned an invalid users response.',
    });
  }

  const allowedRoles: AdminUserRole[] = [
    'reader',
    'author',
    'admin',
  ];

  const users = raw.users.map((value) => {
    if (!isRaw(value) || typeof value.id !== 'string') {
      throw new AppError({
        kind: 'unknown',
        message: 'The server returned invalid user records.',
      });
    }

    const serverRole =
      typeof value.role === 'string' &&
      allowedRoles.includes(value.role as AdminUserRole)
        ? (value.role as AdminUserRole)
        : 'reader';

    return {
      id: value.id,
      username: textOrNull(value.username),
      userTag: textOrNull(value.user_tag),
      email: textOrNull(value.email),
      role: serverRole,
      isPublic:
        typeof value.is_public === 'boolean'
          ? value.is_public
          : null,
      createdAt: textOrNull(value.created_at),
      avatarUrl: textOrNull(value.avatar_url),
    };
  });

  return {
    users,
    total: count(raw.total),
    limit: count(raw.limit),
  };
}

  async getUserDetails(userId: string): Promise<AdminUserDetailsResponse> {
    const raw = await this.api.request({
      method: 'GET',
      path: `/admin/users/${encodeURIComponent(userId)}`,
    });

    if (
      !isRaw(raw) ||
      !isRaw(raw.user) ||
      typeof raw.user.id !== 'string' ||
      !Array.isArray(raw.activity) ||
      !Array.isArray(raw.roleChanges) ||
      typeof raw.activityLimit !== 'number'
    ) {
      throw new AppError({
        kind: 'unknown',
        message: 'The server returned invalid user details.',
      });
    }

    const allowedRoles: AdminUserRole[] = ['reader', 'author', 'admin'];
    const userRole = raw.user.role;
    if (typeof userRole !== 'string' || !allowedRoles.includes(userRole as AdminUserRole)) {
      throw new AppError({ kind: 'unknown', message: 'The server returned an invalid user role.' });
    }

    return {
      user: {
        id: raw.user.id,
        username: textOrNull(raw.user.username),
        userTag: textOrNull(raw.user.userTag),
        email: textOrNull(raw.user.email),
        role: userRole as AdminUserRole,
        isPublic: typeof raw.user.isPublic === 'boolean' ? raw.user.isPublic : null,
        bio: textOrNull(raw.user.bio),
        avatarUrl: textOrNull(raw.user.avatarUrl),
        createdAt: textOrNull(raw.user.createdAt),
        updatedAt: textOrNull(raw.user.updatedAt),
      },
      activity: raw.activity.map((value) => {
        if (!isRaw(value) || typeof value.id !== 'string') {
          throw new AppError({ kind: 'unknown', message: 'The server returned invalid user activity.' });
        }
        return {
          id: value.id,
          activityType: textOrNull(value.activityType) ?? 'unknown',
          novelId: textOrNull(value.novelId),
          chapterId: textOrNull(value.chapterId),
          metadata: isRaw(value.metadata) ? value.metadata : null,
          createdAt: textOrNull(value.createdAt),
        };
      }),
      roleChanges: raw.roleChanges.map((value): AdminUserRoleAuditItem => {
        if (!isRaw(value) || typeof value.id !== 'string' || typeof value.actorUserId !== 'string') {
          throw new AppError({ kind: 'unknown', message: 'The server returned invalid role audit data.' });
        }
        if (typeof value.previousRole !== 'string' || !allowedRoles.includes(value.previousRole as AdminUserRole) || typeof value.newRole !== 'string' || !allowedRoles.includes(value.newRole as AdminUserRole)) {
          throw new AppError({ kind: 'unknown', message: 'The server returned invalid role audit data.' });
        }
        return {
          id: value.id,
          actorUserId: value.actorUserId,
          previousRole: value.previousRole as AdminUserRole,
          newRole: value.newRole as AdminUserRole,
          createdAt: textOrNull(value.createdAt),
        };
      }),
      activityLimit: count(raw.activityLimit),
    };
  }

  async changeUserRole(userId: string, role: AdminUserRole): Promise<AdminRoleChangeResponse> {
    const raw = await this.api.request({
      method: 'POST',
      path: '/admin/users/role',
      body: { userId, role },
    });

    if (
      !isRaw(raw) ||
      typeof raw.userId !== 'string' ||
      typeof raw.previousRole !== 'string' ||
      typeof raw.newRole !== 'string' ||
      typeof raw.changedAt !== 'string'
    ) {
      throw new AppError({
        kind: 'unknown',
        message: 'The server returned an invalid role-change response.',
      });
    }

    const validRoles: AdminUserRole[] = ['reader', 'author', 'admin'];
    if (
      !validRoles.includes(raw.previousRole as AdminUserRole) ||
      !validRoles.includes(raw.newRole as AdminUserRole)
    ) {
      throw new AppError({
        kind: 'unknown',
        message: 'The server returned an invalid user role.',
      });
    }

    return {
      userId: raw.userId,
      previousRole: raw.previousRole as AdminUserRole,
      newRole: raw.newRole as AdminUserRole,
      changedAt: raw.changedAt,
    };
  }

}
