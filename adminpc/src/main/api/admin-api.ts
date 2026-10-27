
import { AppError } from '../../shared/errors';
import type {
  AdminActivityItem,
  AdminDashboardOverview,
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
}
