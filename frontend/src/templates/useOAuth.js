/**
 * ============================================================================
 * OAUTH HOOKS TEMPLATE
 * ============================================================================
 * Unified React hooks for OAuth authentication flows.
 *
 * Usage:
 *   import { useOAuth, useOAuthCallback } from '../templates/useOAuth';
 *
 *   // Initiate OAuth
 *   const { connect, isConnecting } = useOAuth('twitter');
 *   <button onClick={connect}>Connect Twitter</button>
 *
 *   // Handle callback (in callback page)
 *   const { status, error, account } = useOAuthCallback();
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Platform configurations
 */
const PLATFORMS = {
  twitter: {
    name: 'Twitter',
    color: '#1DA1F2',
    icon: 'twitter',
  },
  instagram: {
    name: 'Instagram',
    color: '#E1306C',
    icon: 'instagram',
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    icon: 'youtube',
  },
  github: {
    name: 'GitHub',
    color: '#333333',
    icon: 'github',
  },
  telegram: {
    name: 'Telegram',
    color: '#0088CC',
    icon: 'telegram',
  },
  whatsapp: {
    name: 'WhatsApp',
    color: '#25D366',
    icon: 'whatsapp',
  },
  snapchat: {
    name: 'Snapchat',
    color: '#FFFC00',
    icon: 'snapchat',
  },
};

/**
 * Hook to initiate OAuth flow for a platform
 */
export function useOAuth(platform, options = {}) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const {
    popup = true, // Open in popup vs redirect
    popupWidth = 600,
    popupHeight = 700,
    onSuccess,
    onError,
  } = options;

  const connect = useCallback(() => {
    setIsConnecting(true);
    setError(null);

    const authUrl = `${API_BASE}/oauth/${platform}/auth`;

    if (popup) {
      // Calculate popup position
      const left = window.screenX + (window.outerWidth - popupWidth) / 2;
      const top = window.screenY + (window.outerHeight - popupHeight) / 2;

      const popupWindow = window.open(
        authUrl,
        `oauth_${platform}`,
        `width=${popupWidth},height=${popupHeight},left=${left},top=${top},toolbar=no,menubar=no`
      );

      // Listen for popup close or message
      const checkClosed = setInterval(() => {
        if (popupWindow?.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 500);

      // Listen for success message from popup
      const handleMessage = (event) => {
        if (event.data?.type === 'oauth_success' && event.data?.platform === platform) {
          clearInterval(checkClosed);
          popupWindow?.close();
          setIsConnecting(false);
          onSuccess?.(event.data.account);
        } else if (event.data?.type === 'oauth_error' && event.data?.platform === platform) {
          clearInterval(checkClosed);
          popupWindow?.close();
          setIsConnecting(false);
          setError(event.data.error);
          onError?.(event.data.error);
        }
      };

      window.addEventListener('message', handleMessage);

      // Cleanup listener when popup closes
      const cleanup = () => {
        window.removeEventListener('message', handleMessage);
      };

      // Store cleanup for component unmount
      return cleanup;
    } else {
      // Redirect flow - store current URL for return
      sessionStorage.setItem('oauth_return_url', window.location.href);
      window.location.href = authUrl;
    }
  }, [platform, popup, popupWidth, popupHeight, onSuccess, onError]);

  const disconnect = useCallback(async (accountId) => {
    try {
      const response = await fetch(`${API_BASE}/accounts/${accountId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect account');
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  return {
    connect,
    disconnect,
    isConnecting,
    error,
    platformInfo: PLATFORMS[platform],
  };
}

/**
 * Hook for handling OAuth callback page
 */
export function useOAuthCallback() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const { platform, code, state, error: oauthError } = router.query;

    if (!router.isReady) return;

    // Handle OAuth error
    if (oauthError) {
      setStatus('error');
      setError(oauthError);

      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_error', platform, error: oauthError },
          window.location.origin
        );
      }
      return;
    }

    // If we have account data in query (success redirect)
    if (router.query.success === 'true') {
      setStatus('success');
      setAccount(router.query.account ? JSON.parse(router.query.account) : null);

      // Invalidate accounts cache
      queryClient.invalidateQueries({ queryKey: ['accounts'] });

      // Notify parent window if in popup
      if (window.opener) {
        window.opener.postMessage(
          { type: 'oauth_success', platform, account: router.query.account },
          window.location.origin
        );
      }

      // Redirect after delay if not in popup
      if (!window.opener) {
        const returnUrl = sessionStorage.getItem('oauth_return_url') || '/dashboard/accounts';
        sessionStorage.removeItem('oauth_return_url');
        setTimeout(() => router.push(returnUrl), 2000);
      }
    }
  }, [router.isReady, router.query, queryClient, router]);

  return {
    status,
    error,
    account,
    isPopup: typeof window !== 'undefined' && !!window.opener,
  };
}

/**
 * Hook to manage multiple connected accounts
 */
export function useConnectedAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/accounts`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const data = await response.json();
      setAccounts(data.data?.accounts || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const getAccountsByPlatform = useCallback((platform) => {
    return accounts.filter((acc) => acc.platform === platform);
  }, [accounts]);

  const hasConnectedPlatform = useCallback((platform) => {
    return accounts.some((acc) => acc.platform === platform);
  }, [accounts]);

  return {
    accounts,
    isLoading,
    error,
    refetch: fetchAccounts,
    getAccountsByPlatform,
    hasConnectedPlatform,
    platforms: PLATFORMS,
  };
}

/**
 * OAuth callback page component helper
 * Use in pages/oauth/callback.js
 */
export function OAuthCallbackHandler({ onSuccess, onError }) {
  const { status, error, account, isPopup } = useOAuthCallback();

  useEffect(() => {
    if (status === 'success' && onSuccess) {
      onSuccess(account);
    } else if (status === 'error' && onError) {
      onError(error);
    }
  }, [status, error, account, onSuccess, onError]);

  // Close popup after displaying message
  useEffect(() => {
    if (isPopup && (status === 'success' || status === 'error')) {
      setTimeout(() => window.close(), 1500);
    }
  }, [isPopup, status]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Connecting your account...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Connection Failed</h2>
          <p className="mt-2 text-gray-600">{error}</p>
          {isPopup && <p className="mt-4 text-sm text-gray-500">This window will close automatically...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Account Connected!</h2>
        <p className="mt-2 text-gray-600">Your account has been successfully connected.</p>
        {isPopup && <p className="mt-4 text-sm text-gray-500">This window will close automatically...</p>}
      </div>
    </div>
  );
}

/**
 * Platform connect button component
 */
export function ConnectPlatformButton({ platform, onSuccess, onError, className = '' }) {
  const { connect, isConnecting, platformInfo } = useOAuth(platform, { onSuccess, onError });

  if (!platformInfo) {
    return null;
  }

  return (
    <button
      onClick={connect}
      disabled={isConnecting}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-opacity ${
        isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      } ${className}`}
      style={{ backgroundColor: platformInfo.color }}
    >
      {isConnecting ? (
        <span className="animate-spin">⟳</span>
      ) : (
        <span className="font-bold">{platformInfo.name[0]}</span>
      )}
      <span>{isConnecting ? 'Connecting...' : `Connect ${platformInfo.name}`}</span>
    </button>
  );
}

export default useOAuth;
