/**
 * Accounts Hooks - Built on useCRUD and useOAuth templates
 */
import { createCRUDHooks } from '../templates/useCRUD';
import { useOAuth, useConnectedAccounts } from '../templates/useOAuth';
import { accountsAPI } from '../services/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Create base CRUD hooks
const accountsCRUD = createCRUDHooks('accounts', {
  api: {
    list: () => accountsAPI.list(),
    get: (id) => accountsAPI.get(id),
    delete: (id) => accountsAPI.disconnect(id),
  },
  transformList: (res) => res.data.data,
  transformItem: (res) => res.data.data,
});

// Export CRUD hooks
export const useAccountsList = accountsCRUD.useList;
export const useAccount = accountsCRUD.useGet;
export const useDisconnectAccount = accountsCRUD.useDelete;

// Custom hook: Refresh token
export function useRefreshToken(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => accountsAPI.refresh(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      options.onSuccess?.(res, id);
    },
    onError: options.onError,
  });
}

// Custom hook: Get analytics
export function useAccountAnalytics(accountId, options = {}) {
  return useQuery({
    queryKey: ['accounts', 'analytics', accountId],
    queryFn: () => accountsAPI.analytics(accountId).then(res => res.data.data),
    enabled: !!accountId,
    ...options,
  });
}

// Re-export OAuth hooks
export { useOAuth, useConnectedAccounts };

// Custom hook: Connect platform
export function useConnectPlatform(platform, options = {}) {
  const queryClient = useQueryClient();
  const oauth = useOAuth(platform, {
    ...options,
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      options.onSuccess?.(account);
    },
  });

  return oauth;
}

// Combined hook for account management
export function useAccountManager() {
  const queryClient = useQueryClient();

  return {
    list: useAccountsList,
    get: useAccount,
    disconnect: useDisconnectAccount,
    refresh: useRefreshToken,
    analytics: useAccountAnalytics,
    connect: useConnectPlatform,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['accounts'] }),
  };
}

export default accountsCRUD;
