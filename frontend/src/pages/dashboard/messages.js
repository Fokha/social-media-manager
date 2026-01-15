import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '../../components/Layout/DashboardLayout';
import { messagesAPI } from '../../services/api';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  CheckIcon,
  UserCircleIcon
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

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messagesAPI.conversations().then(res => res.data.data.conversations || [])
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => messagesAPI.conversation(selectedConversation.id).then(res => res.data.data.messages || []),
    enabled: !!selectedConversation
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => messagesAPI.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations']);
      queryClient.invalidateQueries(['unreadCount']);
    }
  });

  const sendMutation = useMutation({
    mutationFn: (data) => messagesAPI.send(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      setReplyText('');
    }
  });

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    if (!conversation.isRead) {
      markReadMutation.mutate(conversation.id);
    }
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConversation) return;

    sendMutation.mutate({
      conversationId: selectedConversation.id,
      content: replyText,
      platform: selectedConversation.platform
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-600">Manage conversations across all platforms</p>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          {/* Conversations List */}
          <div className="border-r border-gray-200 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : conversations?.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {conversations.map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      selectedConversation?.id === conversation.id ? 'bg-primary-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${platformColors[conversation.platform] || 'bg-gray-500'} flex items-center justify-center flex-shrink-0`}>
                        {conversation.senderAvatar ? (
                          <img src={conversation.senderAvatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserCircleIcon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${!conversation.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                            {conversation.senderName || 'Unknown'}
                          </p>
                          {!conversation.isRead && (
                            <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                        <p className="text-xs text-gray-400 mt-1 capitalize">{conversation.platform}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No conversations yet</p>
              </div>
            )}
          </div>

          {/* Message Thread */}
          <div className="col-span-2 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${platformColors[selectedConversation.platform] || 'bg-gray-500'} flex items-center justify-center`}>
                      <UserCircleIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedConversation.senderName}</p>
                      <p className="text-sm text-gray-500 capitalize">{selectedConversation.platform}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages?.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          message.isOutgoing
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${message.isOutgoing ? 'text-primary-200' : 'text-gray-500'}`}>
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <form onSubmit={handleSendReply} className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply..."
                      className="input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={!replyText.trim() || sendMutation.isPending}
                      className="btn btn-primary"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p>Select a conversation to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Messages.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};
