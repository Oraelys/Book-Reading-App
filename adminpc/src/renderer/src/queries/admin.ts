
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/bridge';

export const adminDashboardKey = ['admin', 'dashboard'] as const;

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKey,
    queryFn: api.admin.dashboardOverview,
    refetchInterval: 60_000,
  });
}
