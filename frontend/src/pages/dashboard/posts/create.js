import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/Layout/DashboardLayout';
import { accountsAPI, postsAPI, aiAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import {
  PhotoIcon,
  VideoCameraIcon,
  SparklesIcon,
  CalendarIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  HashtagIcon
} from '@heroicons/react/24/outline';

const contentTypes = [
  { id: 'text', name: 'Text', icon: '📝' },
  { id: 'image', name: 'Image', icon: '🖼️' },
  { id: 'video', name: 'Video', icon: '🎬' },
  { id: 'carousel', name: 'Carousel', icon: '📊' },
  { id: 'story', name: 'Story', icon: '⭕' },
  { id: 'reel', name: 'Reel', icon: '🎞️' }
];

export default function CreatePost() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedAccount, setSelectedAccount] = useState('');
  const [content, setContent] = useState('');
  const [contentType, setContentType] = useState('text');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsAPI.list().then(res => res.data.data.accounts)
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => postsAPI.create(data),
    onSuccess: (response) => {
      toast.success(scheduledAt ? 'Post scheduled!' : 'Post created!');
      queryClient.invalidateQueries(['posts']);
      router.push('/dashboard/posts');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create post');
    }
  });

  const publishMutation = useMutation({
    mutationFn: (id) => postsAPI.publish(id),
    onSuccess: () => {
      toast.success('Post published!');
      queryClient.invalidateQueries(['posts']);
      router.push('/dashboard/posts');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to publish');
    }
  });

  const generateContent = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account first');
      return;
    }

    const account = accounts?.find(a => a.id === selectedAccount);
    setIsGenerating(true);

    try {
      const response = await aiAPI.generateContent({
        platform: account?.platform,
        topic: 'engaging social media content',
        tone: 'professional',
        includeHashtags: true
      });

      setContent(response.data.data.content);
      toast.success('Content generated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const suggestHashtags = async () => {
    if (!content) {
      toast.error('Please add content first');
      return;
    }

    const account = accounts?.find(a => a.id === selectedAccount);

    try {
      const response = await aiAPI.hashtagSuggestions({
        content,
        platform: account?.platform,
        count: 10
      });

      setHashtags(response.data.data.hashtags);
      toast.success('Hashtags suggested!');
    } catch (error) {
      toast.error('Failed to suggest hashtags');
    }
  };

  const handleSubmit = (publish = false) => {
    if (!selectedAccount) {
      toast.error('Please select an account');
      return;
    }

    if (!content.trim()) {
      toast.error('Please add content');
      return;
    }

    const postData = {
      socialAccountId: selectedAccount,
      content,
      contentType,
      mediaUrls,
      hashtags,
      scheduledAt: scheduledAt || null
    };

    createPostMutation.mutate(postData, {
      onSuccess: (response) => {
        if (publish) {
          publishMutation.mutate(response.data.data.post.id);
        }
      }
    });
  };

  const selectedAccountData = accounts?.find(a => a.id === selectedAccount);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
        <p className="text-gray-600">Compose and schedule your social media content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Account Selection */}
          <div className="card">
            <label className="label">Select Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="input"
            >
              <option value="">Choose an account...</option>
              {accounts?.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.platformDisplayName || account.platformUsername} ({account.platform})
                </option>
              ))}
            </select>
          </div>

          {/* Content Type */}
          <div className="card">
            <label className="label">Content Type</label>
            <div className="flex flex-wrap gap-2">
              {contentTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setContentType(type.id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    contentType === type.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-1">{type.icon}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Content</label>
              <button
                onClick={generateContent}
                disabled={isGenerating || !selectedAccount}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                {isGenerating ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SparklesIcon className="w-4 h-4" />
                )}
                AI Generate
              </button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              className="input resize-none"
            />
            <div className="mt-2 text-sm text-gray-500">
              {content.length} characters
              {selectedAccountData?.platform === 'twitter' && content.length > 280 && (
                <span className="text-red-500 ml-2">(Twitter limit: 280)</span>
              )}
            </div>
          </div>

          {/* Media Upload */}
          {['image', 'video', 'carousel', 'story', 'reel'].includes(contentType) && (
            <div className="card">
              <label className="label">Media</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                <input
                  type="text"
                  placeholder="Or paste media URL..."
                  value={mediaUrls[0] || ''}
                  onChange={(e) => setMediaUrls([e.target.value])}
                  className="input mt-2"
                />
              </div>
            </div>
          )}

          {/* Hashtags */}
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Hashtags</label>
              <button
                onClick={suggestHashtags}
                disabled={!content}
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                <HashtagIcon className="w-4 h-4" />
                Suggest Hashtags
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {hashtags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm cursor-pointer hover:bg-primary-200"
                  onClick={() => setHashtags(hashtags.filter((_, i) => i !== index))}
                >
                  #{tag} ×
                </span>
              ))}
              <input
                type="text"
                placeholder="Add hashtag..."
                className="px-3 py-1 border border-gray-200 rounded-full text-sm outline-none focus:border-primary-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    setHashtags([...hashtags, e.target.value.replace('#', '')]);
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Schedule */}
          <div className="card">
            <label className="label">Schedule</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="input"
            />
            {scheduledAt && (
              <p className="mt-2 text-sm text-gray-500">
                Will be published on {new Date(scheduledAt).toLocaleString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="card space-y-3">
            <button
              onClick={() => handleSubmit(false)}
              disabled={createPostMutation.isLoading}
              className="w-full btn btn-secondary flex items-center justify-center gap-2"
            >
              <CalendarIcon className="w-5 h-5" />
              {scheduledAt ? 'Schedule Post' : 'Save as Draft'}
            </button>

            <button
              onClick={() => handleSubmit(true)}
              disabled={createPostMutation.isLoading || publishMutation.isLoading}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              {createPostMutation.isLoading || publishMutation.isLoading ? (
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              ) : (
                <PaperAirplaneIcon className="w-5 h-5" />
              )}
              Publish Now
            </button>
          </div>

          {/* Preview */}
          {content && selectedAccountData && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full" />
                  <div>
                    <p className="text-sm font-medium">{selectedAccountData.platformDisplayName}</p>
                    <p className="text-xs text-gray-500">{selectedAccountData.platform}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {content}
                  {hashtags.length > 0 && (
                    <span className="text-primary-600">
                      {'\n\n'}#{hashtags.join(' #')}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

CreatePost.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
