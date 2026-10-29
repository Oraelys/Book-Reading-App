
import { useQuery } from '@tanstack/react-query';
import type { AdminUserRole } from '../../../shared/admin-types';
import { api } from '../lib/bridge';

export const adminUsersKey = (
  search: string,
  role: AdminUserRole | 'all',
) => ['admin', 'users', search, role] as const;

export function useAdminUsers(
  search: string,
  role: AdminUserRole | 'all',
) {
  return useQuery({
    queryKey: adminUsersKey(search, role),
    queryFn: () => api.admin.listUsers(search, role),
    staleTime: 30_000,
  });
}
