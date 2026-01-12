import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { accountsAPI, postsAPI, messagesAPI, subscriptionsAPI } from '../../services/api';
import {
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  ArrowTrendingUpIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const platformColors = {
  youtube: 'bg-red-500',
  instagram: 'bg-pink-500',
  twitter: 'bg-blue-400',
  linkedin: 'bg-blue-700',
  snapchat: 'bg-yellow-400',
  whatsapp: 'bg-green-500',
  telegram: 'bg-cyan-500',
  github: 'bg-gray-800',
  email: 'bg-purple-500'
};

export default function Dashboard() {
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.list().then(res => res.data.data.accounts)
  });

  const { data: recentPosts } = useQuery({
    queryKey: ['posts', 'recent'],
    queryFn: () => postsAPI.list({ limit: 5 }).then(res => res.data.data.posts)
  });

  const { data: usage } = useQuery({
    queryKey: ['usage'],
    queryFn: () => subscriptionsAPI.usage().then(res => res.data.data)
  });

  const { data: unreadMessages } = useQuery({
    queryKey: ['unreadCount'],
    queryFn: () => messagesAPI.unreadCount().then(res => res.data.data.unreadCount)
  });

  const stats = [
    {
      name: 'Connected Accounts',
      value: accounts?.length || 0,
      limit: usage?.limits?.socialAccounts,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      href: '/dashboard/accounts'
    },
    {
      name: 'Posts This Month',
      value: usage?.usage?.postsThisMonth || 0,
      limit: usage?.limits?.postsPerMonth,
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      href: '/dashboard/posts'
    },
    {
      name: 'Unread Messages',
      value: unreadMessages || 0,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-500',
      href: '/dashboard/messages'
    },
    {
      name: 'AI Credits Used',
      value: usage?.usage?.aiCreditsUsed || 0,
      limit: usage?.limits?.aiCredits,
      icon: SparklesIcon,
      color: 'bg-orange-500',
      href: '/dashboard/ai'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <div className="card hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                    {stat.limit && stat.limit !== -1 && (
                      <span className="text-sm text-gray-500 font-normal">/{stat.limit}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connected Accounts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
            <Link href="/dashboard/accounts" className="text-sm text-primary-600 hover:underline">
              Manage
            </Link>
          </div>

          {accounts?.length > 0 ? (
            <div className="space-y-3">
              {accounts.slice(0, 5).map((account) => (
                <div key={account.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-10 h-10 rounded-full ${platformColors[account.platform]} flex items-center justify-center`}>
                    {account.profilePicture ? (
                      <img src={account.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {account.platform[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {account.platformDisplayName || account.platformUsername}
                    </p>
                    <p className="text-sm text-gray-500 capitalize">{account.platform}</p>
                  </div>
                  <span className="w-2 h-2 bg-green-500 rounded-full" title="Connected" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No accounts connected yet</p>
              <Link href="/dashboard/accounts" className="btn btn-primary">
                Connect Account
              </Link>
            </div>
          )}
        </div>

        {/* Recent Posts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Posts</h2>
            <Link href="/dashboard/posts" className="text-sm text-primary-600 hover:underline">
              View All
            </Link>
          </div>

          {recentPosts?.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${platformColors[post.socialAccount?.platform]} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-xs">
                      {post.socialAccount?.platform?.[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`status-badge status-${post.status}`}>
                        {post.status}
                      </span>
                      {post.scheduledAt && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {new Date(post.scheduledAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">No posts yet</p>
              <Link href="/dashboard/posts/create" className="btn btn-primary">
                Create Post
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/posts/create" className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors text-center">
            <DocumentTextIcon className="w-8 h-8 text-primary-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-primary-700">Create Post</span>
          </Link>
          <Link href="/dashboard/messages" className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-center">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-700">Messages</span>
          </Link>
          <Link href="/dashboard/ai" className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-center">
            <SparklesIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-700">AI Assistant</span>
          </Link>
          <Link href="/dashboard/analytics" className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-center">
            <ArrowTrendingUpIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-700">Analytics</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

Dashboard.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
