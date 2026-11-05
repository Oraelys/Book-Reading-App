
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


export function useAdminUserDetails(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'user-details', userId],
    queryFn: () => api.admin.getUserDetails(userId as string),
    enabled: Boolean(userId),
    staleTime: 15_000,
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


export function useSetAdminUserSuspension() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      isSuspended,
      reason,
    }: {
      userId: string;
      isSuspended: boolean;
      reason?: string;
    }) => api.admin.setUserSuspension(userId, isSuspended, reason),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      await queryClient.invalidateQueries({
        queryKey: ['admin', 'user-details', variables.userId],
      });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
    },
  });
}
