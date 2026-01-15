/**
 * Messages Hooks - Built on useCRUD template
 */
import { createCRUDHooks } from '../templates/useCRUD';
import { messagesAPI } from '../services/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Create base CRUD hooks
const messagesCRUD = createCRUDHooks('messages', {
  api: {
    list: (params) => messagesAPI.list(params),
  },
  transformList: (res) => res.data.data,
});

// Export list hook
export const useMessagesList = messagesCRUD.useList;

// Custom hook: Get conversations
export function useConversations(params = {}, options = {}) {
  return useQuery({
    queryKey: ['messages', 'conversations', params],
    queryFn: () => messagesAPI.conversations(params).then(res => res.data.data.conversations),
    ...options,
  });
}

// Custom hook: Get conversation messages
export function useConversation(conversationId, params = {}, options = {}) {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId, params],
    queryFn: () => messagesAPI.conversation(conversationId, params).then(res => res.data.data.messages),
    enabled: !!conversationId,
    ...options,
  });
}

// Custom hook: Send message
export function useSendMessage(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => messagesAPI.send(data),
    onSuccess: (res, data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      options.onSuccess?.(res, data);
    },
    onError: options.onError,
  });
}

// Custom hook: Mark as read
export function useMarkMessageRead(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => messagesAPI.markRead(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      options.onSuccess?.(res, id);
    },
    onError: options.onError,
  });
}

// Custom hook: Unread count
export function useUnreadCount(options = {}) {
  return useQuery({
    queryKey: ['messages', 'unreadCount'],
    queryFn: () => messagesAPI.unreadCount().then(res => res.data.data.unreadCount),
    refetchInterval: 30000, // Refresh every 30 seconds
    ...options,
  });
}

// Combined hook for message management
export function useMessageManager() {
  const queryClient = useQueryClient();

  return {
    list: useMessagesList,
    conversations: useConversations,
    conversation: useConversation,
    send: useSendMessage,
    markRead: useMarkMessageRead,
    unreadCount: useUnreadCount,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['messages'] }),
  };
}

export default messagesCRUD;
