import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { aiAPI } from '../../services/api';
import {
  SparklesIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  HashtagIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

const contentTypes = [
  { id: 'post', name: 'Social Post', icon: DocumentTextIcon },
  { id: 'caption', name: 'Photo Caption', icon: PencilSquareIcon },
  { id: 'thread', name: 'Twitter Thread', icon: ChatBubbleBottomCenterTextIcon },
  { id: 'hashtags', name: 'Hashtag Ideas', icon: HashtagIcon },
];

const tones = ['professional', 'casual', 'humorous', 'inspirational', 'educational'];

const platforms = ['twitter', 'instagram', 'linkedin', 'youtube', 'general'];

export default function AIAssistant() {
  const [activeTab, setActiveTab] = useState('generate');
  const [contentType, setContentType] = useState('post');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [platform, setPlatform] = useState('general');
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentToImprove, setContentToImprove] = useState('');
  const [improvedContent, setImprovedContent] = useState('');
  const [copied, setCopied] = useState(false);

  const generateMutation = useMutation({
    mutationFn: (data) => aiAPI.generateContent(data),
    onSuccess: (res) => {
      setGeneratedContent(res.data.data.content);
    }
  });

  const improveMutation = useMutation({
    mutationFn: (data) => aiAPI.improveContent(data),
    onSuccess: (res) => {
      setImprovedContent(res.data.data.content);
    }
  });

  const hashtagMutation = useMutation({
    mutationFn: (data) => aiAPI.hashtagSuggestions(data),
    onSuccess: (res) => {
      setGeneratedContent(res.data.data.hashtags?.join(' ') || res.data.data.content);
    }
  });

  const handleGenerate = (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (contentType === 'hashtags') {
      hashtagMutation.mutate({ topic, platform, count: 10 });
    } else {
      generateMutation.mutate({
        type: contentType,
        topic,
        tone,
        platform,
        maxLength: platform === 'twitter' ? 280 : 500
      });
    }
  };

  const handleImprove = (e) => {
    e.preventDefault();
    if (!contentToImprove.trim()) return;

    improveMutation.mutate({
      content: contentToImprove,
      improvements: ['clarity', 'engagement', 'grammar'],
      platform
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isLoading = generateMutation.isPending || improveMutation.isPending || hashtagMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-gray-600">Generate and improve your social media content with AI</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'generate'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <SparklesIcon className="w-5 h-5 inline mr-2" />
            Generate Content
          </button>
          <button
            onClick={() => setActiveTab('improve')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'improve'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PencilSquareIcon className="w-5 h-5 inline mr-2" />
            Improve Content
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="card">
          {activeTab === 'generate' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {contentTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setContentType(type.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        contentType === type.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <type.icon className={`w-5 h-5 mb-1 ${contentType === type.id ? 'text-primary-600' : 'text-gray-500'}`} />
                      <span className={`text-sm font-medium ${contentType === type.id ? 'text-primary-700' : 'text-gray-700'}`}>
                        {type.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topic or Description
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What would you like to write about?"
                  className="input h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="input"
                  >
                    {tones.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="input"
                  >
                    {platforms.map((p) => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
                {isLoading ? 'Generating...' : 'Generate Content'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleImprove} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content to Improve
                </label>
                <textarea
                  value={contentToImprove}
                  onChange={(e) => setContentToImprove(e.target.value)}
                  placeholder="Paste your content here..."
                  className="input h-40"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="input"
                >
                  {platforms.map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !contentToImprove.trim()}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  <SparklesIcon className="w-5 h-5" />
                )}
                {isLoading ? 'Improving...' : 'Improve Content'}
              </button>
            </form>
          )}
        </div>

        {/* Output Section */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {activeTab === 'generate' ? 'Generated Content' : 'Improved Content'}
            </h3>
            {(generatedContent || improvedContent) && (
              <button
                onClick={() => copyToClipboard(activeTab === 'generate' ? generatedContent : improvedContent)}
                className="btn btn-secondary btn-sm flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          {activeTab === 'generate' ? (
            generatedContent ? (
              <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-900 whitespace-pre-wrap">{generatedContent}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Your generated content will appear here</p>
                </div>
              </div>
            )
          ) : (
            improvedContent ? (
              <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-900 whitespace-pre-wrap">{improvedContent}</p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <PencilSquareIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Your improved content will appear here</p>
                </div>
              </div>
            )
          )}

          {(generateMutation.isError || improveMutation.isError || hashtagMutation.isError) && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="text-sm">
                {generateMutation.error?.response?.data?.error ||
                 improveMutation.error?.response?.data?.error ||
                 hashtagMutation.error?.response?.data?.error ||
                 'Failed to generate content. Please ensure AI service is configured.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AIAssistant.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
