
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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


export function useChangeAdminUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AdminUserRole }) =>
      api.admin.changeUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
