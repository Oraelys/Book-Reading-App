
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
