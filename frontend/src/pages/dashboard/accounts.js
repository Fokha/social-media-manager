import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { accountsAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const platforms = [
  { id: 'youtube', name: 'YouTube', color: 'bg-red-500', description: 'Videos, Shorts, Comments' },
  { id: 'instagram', name: 'Instagram', color: 'bg-pink-500', description: 'Posts, Stories, Reels, DMs' },
  { id: 'twitter', name: 'X (Twitter)', color: 'bg-blue-400', description: 'Tweets, DMs, Threads' },
  { id: 'linkedin', name: 'LinkedIn', color: 'bg-blue-700', description: 'Posts, Articles' },
  { id: 'snapchat', name: 'Snapchat', color: 'bg-yellow-400', description: 'Stories, Ads' },
  { id: 'whatsapp', name: 'WhatsApp Business', color: 'bg-green-500', description: 'Messages, Templates' },
  { id: 'telegram', name: 'Telegram', color: 'bg-cyan-500', description: 'Channels, Groups, Bots' },
  { id: 'github', name: 'GitHub', color: 'bg-gray-800', description: 'Repos, Issues, Releases' },
  { id: 'email', name: 'Email (Gmail)', color: 'bg-purple-500', description: 'Send, Receive' }
];

export default function Accounts() {
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.list().then(res => res.data.data.accounts)
  });

  const disconnectMutation = useMutation({
    mutationFn: (id) => accountsAPI.disconnect(id),
    onSuccess: () => {
      toast.success('Account disconnected');
      queryClient.invalidateQueries(['accounts']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to disconnect');
    }
  });

  const connectAccount = async (platform) => {
    setConnecting(platform);
    try {
      const response = await accountsAPI.getConnectUrl(platform);
      window.location.href = response.data.data.authUrl;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate connection');
      setConnecting(null);
    }
  };

  const getConnectedAccount = (platformId) => {
    return accounts?.find(a => a.platform === platformId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Connected Accounts</h1>
        <p className="text-gray-600">Manage your social media and service accounts</p>
      </div>

      {/* Connected Accounts */}
      {accounts?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Accounts</h2>
          <div className="space-y-4">
            {accounts.map((account) => {
              const platform = platforms.find(p => p.id === account.platform);
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
                >
                  <div className={`w-12 h-12 rounded-full ${platform?.color || 'bg-gray-500'} flex items-center justify-center`}>
                    {account.profilePicture ? (
                      <img
                        src={account.profilePicture}
                        alt=""
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-bold">
                        {account.platform[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {account.platformDisplayName || account.platformUsername}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{account.platform}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircleIcon className="w-4 h-4" />
                      Connected
                    </span>
                    <button
                      onClick={() => disconnectMutation.mutate(account.id)}
                      disabled={disconnectMutation.isLoading}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      title="Disconnect"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Platforms */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect New Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((platform) => {
            const connected = getConnectedAccount(platform.id);
            const isConnecting = connecting === platform.id;

            return (
              <div
                key={platform.id}
                className={`relative p-4 border rounded-lg transition-all ${
                  connected
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${platform.color} flex items-center justify-center`}>
                    <span className="text-white font-bold text-sm">
                      {platform.name[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                </div>

                <div className="mt-4">
                  {connected ? (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 flex items-center gap-1">
                        <CheckCircleIcon className="w-4 h-4" />
                        Connected as {connected.platformUsername}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectAccount(platform.id)}
                      disabled={isConnecting}
                      className="w-full btn btn-primary flex items-center justify-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <PlusIcon className="w-4 h-4" />
                          Connect
                        </>
                      )}
                    </button>
                  )}
                </div>

                {platform.id === 'whatsapp' && (
                  <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    Requires WhatsApp Business API approval
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

Accounts.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
