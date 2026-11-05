
export interface AdminActivityItem {
  id: string;
  userId: string | null;
  activityType: string;
  novelId: string | null;
  chapterId: string | null;
  createdAt: string | null;
}

export interface AdminDashboardOverview {
  totals: {
    users: number;
    novels: number;
    chapters: number;
    publishedChapters: number;
  };
  recentActivity: AdminActivityItem[];
  generatedAt: string;
}


export type AdminUserRole = 'reader' | 'author' | 'admin';

export interface AdminUser {
  id: string;
  username: string | null;
  userTag: string | null;
  email: string | null;
  role: AdminUserRole;
  isPublic: boolean | null;
  createdAt: string | null;
  avatarUrl: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
}

export interface AdminRoleChangeResponse {
  userId: string;
  previousRole: AdminUserRole;
  newRole: AdminUserRole;
  changedAt: string;
}


export interface AdminUserActivityItem {
  id: string;
  activityType: string;
  novelId: string | null;
  chapterId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string | null;
}

export interface AdminUserRoleAuditItem {
  id: string;
  actorUserId: string;
  previousRole: AdminUserRole;
  newRole: AdminUserRole;
  createdAt: string | null;
}

export interface AdminUserDetailsResponse {
  user: AdminUser & {
    bio: string | null;
    updatedAt: string | null;
  };
  activity: AdminUserActivityItem[];
  roleChanges: AdminUserRoleAuditItem[];
  activityLimit: number;
}


export interface AdminUserSuspensionResponse {
  userId: string;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  changedAt: string;
}
