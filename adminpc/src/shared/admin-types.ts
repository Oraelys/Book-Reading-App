
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
}

export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
  limit: number;
}