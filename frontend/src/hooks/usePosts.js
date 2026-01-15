/**
 * Posts Hooks - Built on useCRUD template
 */
import { createCRUDHooks } from '../templates/useCRUD';
import { postsAPI } from '../services/api';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

// Create base CRUD hooks
const postsCRUD = createCRUDHooks('posts', {
  api: {
    list: (params) => postsAPI.list(params),
    get: (id) => postsAPI.get(id),
    create: (data) => postsAPI.create(data),
    update: (id, data) => postsAPI.update(id, data),
    delete: (id) => postsAPI.delete(id),
  },
  transformList: (res) => res.data.data,
  transformItem: (res) => res.data.data,
});

// Export CRUD hooks
export const usePostsList = postsCRUD.useList;
export const usePost = postsCRUD.useGet;
export const useCreatePost = postsCRUD.useCreate;
export const useUpdatePost = postsCRUD.useUpdate;
export const useDeletePost = postsCRUD.useDelete;

// Custom hook: Publish post
export function usePublishPost(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => postsAPI.publish(id),
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['posts', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['posts', 'detail', id] });
      options.onSuccess?.(res, id);
    },
    onError: options.onError,
  });
}

// Custom hook: Calendar view
export function usePostsCalendar(startDate, endDate, options = {}) {
  return useQuery({
    queryKey: ['posts', 'calendar', startDate, endDate],
    queryFn: () => postsAPI.calendar(startDate, endDate).then(res => res.data.data.posts),
    enabled: !!startDate && !!endDate,
    ...options,
  });
}

// Combined hook for post management
export function usePostManager() {
  const queryClient = useQueryClient();

  return {
    list: usePostsList,
    get: usePost,
    create: useCreatePost,
    update: useUpdatePost,
    delete: useDeletePost,
    publish: usePublishPost,
    calendar: usePostsCalendar,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  };
}

export default postsCRUD;
