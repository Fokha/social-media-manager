import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { postsAPI } from '../../../services/api';
import Link from 'next/link';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PaperAirplaneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

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

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700'
};

const statusIcons = {
  draft: PencilIcon,
  scheduled: ClockIcon,
  published: CheckCircleIcon,
  failed: XCircleIcon
};

export default function Posts() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['posts', filter, page],
    queryFn: () => postsAPI.list({
      page,
      limit: 10,
      status: filter !== 'all' ? filter : undefined
    }).then(res => res.data.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => postsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id) => postsAPI.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['posts']);
    }
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this post?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePublish = (id) => {
    if (confirm('Publish this post now?')) {
      publishMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600">Manage your social media posts</p>
        </div>
        <Link href="/dashboard/posts/create" className="btn btn-primary flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Create Post
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-600 mr-2">Filter:</span>
          {['all', 'draft', 'scheduled', 'published', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => { setFilter(status); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div className="card">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </div>
        ) : data?.posts?.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {data.posts.map((post) => {
              const StatusIcon = statusIcons[post.status] || PencilIcon;
              return (
                <div key={post.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full ${platformColors[post.socialAccount?.platform] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-sm">
                        {post.socialAccount?.platform?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 mb-2">{post.content}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[post.status]}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {post.status}
                        </span>

                        {post.scheduledAt && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {new Date(post.scheduledAt).toLocaleString()}
                          </span>
                        )}

                        <span className="text-xs text-gray-500">
                          {post.socialAccount?.platformDisplayName || post.socialAccount?.platformUsername}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.status === 'draft' && (
                        <button
                          onClick={() => handlePublish(post.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                          title="Publish Now"
                        >
                          <PaperAirplaneIcon className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Edit"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No posts found</p>
            <Link href="/dashboard/posts/create" className="btn btn-primary">
              Create Your First Post
            </Link>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Posts.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
