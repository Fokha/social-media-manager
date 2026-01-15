import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { accountsAPI, postsAPI } from '../../services/api';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const platformColors = {
  youtube: { bg: 'bg-red-500', text: 'text-red-600', light: 'bg-red-100' },
  instagram: { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-100' },
  twitter: { bg: 'bg-blue-400', text: 'text-blue-600', light: 'bg-blue-100' },
  linkedin: { bg: 'bg-blue-700', text: 'text-blue-700', light: 'bg-blue-100' },
  snapchat: { bg: 'bg-yellow-400', text: 'text-yellow-600', light: 'bg-yellow-100' },
  whatsapp: { bg: 'bg-green-500', text: 'text-green-600', light: 'bg-green-100' },
  telegram: { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-100' },
};

export default function Analytics() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dateRange, setDateRange] = useState('7d');

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.list().then(res => res.data.data.accounts)
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', selectedAccount?.id, dateRange],
    queryFn: () => accountsAPI.analytics(selectedAccount.id).then(res => res.data.data),
    enabled: !!selectedAccount
  });

  const { data: posts } = useQuery({
    queryKey: ['posts', 'analytics'],
    queryFn: () => postsAPI.list({ limit: 50, status: 'published' }).then(res => res.data.data.posts)
  });

  // Calculate aggregate stats from posts
  const aggregateStats = posts?.reduce((acc, post) => {
    acc.totalPosts++;
    acc.totalLikes += post.analytics?.likes || 0;
    acc.totalComments += post.analytics?.comments || 0;
    acc.totalShares += post.analytics?.shares || 0;
    acc.totalViews += post.analytics?.views || 0;
    return acc;
  }, { totalPosts: 0, totalLikes: 0, totalComments: 0, totalShares: 0, totalViews: 0 }) || {};

  const overviewStats = [
    { name: 'Total Posts', value: aggregateStats.totalPosts || 0, icon: ChartBarIcon, color: 'blue' },
    { name: 'Total Views', value: aggregateStats.totalViews || 0, icon: EyeIcon, color: 'purple' },
    { name: 'Total Likes', value: aggregateStats.totalLikes || 0, icon: HeartIcon, color: 'red' },
    { name: 'Total Comments', value: aggregateStats.totalComments || 0, icon: ChatBubbleLeftIcon, color: 'green' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your social media performance</p>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewStats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Selection */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Analytics</h2>

        {accounts?.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {accounts.map((account) => {
                const colors = platformColors[account.platform] || { bg: 'bg-gray-500', text: 'text-gray-600', light: 'bg-gray-100' };
                return (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                      selectedAccount?.id === account.id
                        ? `${colors.bg} text-white`
                        : `${colors.light} ${colors.text} hover:opacity-80`
                    }`}
                  >
                    <span className="font-medium">
                      {account.platformDisplayName || account.platformUsername}
                    </span>
                    <span className="text-sm opacity-75 capitalize">
                      ({account.platform})
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedAccount ? (
              isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading analytics...</p>
                </div>
              ) : analytics ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <UserGroupIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Followers</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.followers?.toLocaleString() || '0'}
                    </p>
                    {analytics.followersChange && (
                      <p className={`text-sm flex items-center gap-1 ${analytics.followersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analytics.followersChange > 0 ? (
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4" />
                        )}
                        {Math.abs(analytics.followersChange)}%
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <EyeIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Impressions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.impressions?.toLocaleString() || '0'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <HeartIcon className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Engagement Rate</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.engagementRate?.toFixed(2) || '0'}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No analytics data available for this account</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Select an account to view analytics</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-4">Connect accounts to see analytics</p>
            <a href="/dashboard/accounts" className="btn btn-primary">
              Connect Account
            </a>
          </div>
        )}
      </div>

      {/* Top Performing Posts */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Posts</h2>

        {posts?.length > 0 ? (
          <div className="space-y-4">
            {posts
              .sort((a, b) => ((b.analytics?.likes || 0) + (b.analytics?.comments || 0)) - ((a.analytics?.likes || 0) + (a.analytics?.comments || 0)))
              .slice(0, 5)
              .map((post) => (
                <div key={post.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full ${platformColors[post.socialAccount?.platform]?.bg || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">
                      {post.socialAccount?.platform?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <HeartIcon className="w-4 h-4" />
                        {post.analytics?.likes || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChatBubbleLeftIcon className="w-4 h-4" />
                        {post.analytics?.comments || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ShareIcon className="w-4 h-4" />
                        {post.analytics?.shares || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No published posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

Analytics.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
