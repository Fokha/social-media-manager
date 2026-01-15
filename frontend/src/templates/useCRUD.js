/**
 * ============================================================================
 * CRUD HOOKS TEMPLATE
 * ============================================================================
 * Unified React Query hooks for any CRUD resource.
 *
 * Usage:
 *   import { createCRUDHooks } from '../templates/useCRUD';
 *   import api from '../services/api';
 *
 *   // Create hooks for posts
 *   const postsHooks = createCRUDHooks('posts', {
 *     baseUrl: '/posts',
 *     api: postsAPI,
 *   });
 *
 *   // Use in component
 *   const { data, isLoading } = postsHooks.useList({ page: 1, limit: 20 });
 *   const { mutate: createPost } = postsHooks.useCreate();
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Create CRUD hooks for a resource
 * @param {string} resourceKey - Unique key for React Query cache
 * @param {Object} config - Configuration options
 * @param {Object} config.api - API service with list, get, create, update, delete methods
 * @param {Function} config.transformList - Transform list response data
 * @param {Function} config.transformItem - Transform single item response data
 * @param {Object} config.defaultQueryOptions - Default options for queries
 */
export function createCRUDHooks(resourceKey, config = {}) {
  const {
    api,
    transformList = (res) => res.data.data,
    transformItem = (res) => res.data.data,
    defaultQueryOptions = {},
  } = config;

  /**
   * List hook with pagination, search, and filters
   */
  function useList(params = {}, options = {}) {
    const { page = 1, limit = 20, search, sortBy, sortOrder, ...filters } = params;

    return useQuery({
      queryKey: [resourceKey, 'list', { page, limit, search, sortBy, sortOrder, ...filters }],
      queryFn: () => api.list({ page, limit, search, sortBy, sortOrder, ...filters }).then(transformList),
      ...defaultQueryOptions,
      ...options,
    });
  }

  /**
   * Get single item by ID
   */
  function useGet(id, options = {}) {
    return useQuery({
      queryKey: [resourceKey, 'detail', id],
      queryFn: () => api.get(id).then(transformItem),
      enabled: !!id,
      ...defaultQueryOptions,
      ...options,
    });
  }

  /**
   * Create mutation
   */
  function useCreate(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data) => api.create(data),
      onSuccess: (res, variables, context) => {
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [resourceKey, 'list'] });
        options.onSuccess?.(res, variables, context);
      },
      onError: options.onError,
    });
  }

  /**
   * Update mutation
   */
  function useUpdate(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }) => api.update(id, data),
      onSuccess: (res, variables, context) => {
        // Invalidate both list and specific item
        queryClient.invalidateQueries({ queryKey: [resourceKey, 'list'] });
        queryClient.invalidateQueries({ queryKey: [resourceKey, 'detail', variables.id] });
        options.onSuccess?.(res, variables, context);
      },
      onError: options.onError,
    });
  }

  /**
   * Delete mutation
   */
  function useDelete(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id) => api.delete(id),
      onSuccess: (res, id, context) => {
        // Invalidate list and remove specific item from cache
        queryClient.invalidateQueries({ queryKey: [resourceKey, 'list'] });
        queryClient.removeQueries({ queryKey: [resourceKey, 'detail', id] });
        options.onSuccess?.(res, id, context);
      },
      onError: options.onError,
    });
  }

  /**
   * Bulk delete mutation
   */
  function useBulkDelete(options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (ids) => api.bulkDelete(ids),
      onSuccess: (res, ids, context) => {
        queryClient.invalidateQueries({ queryKey: [resourceKey, 'list'] });
        ids.forEach(id => {
          queryClient.removeQueries({ queryKey: [resourceKey, 'detail', id] });
        });
        options.onSuccess?.(res, ids, context);
      },
      onError: options.onError,
    });
  }

  /**
   * Optimistic update helper
   * Usage: const { mutate } = useOptimisticUpdate('list', (old, newData) => [...old, newData]);
   */
  function useOptimisticUpdate(queryType, updateFn, options = {}) {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: options.mutationFn || api.update,
      onMutate: async (newData) => {
        // Cancel outgoing refetches
        await queryClient.cancelQueries({ queryKey: [resourceKey, queryType] });

        // Snapshot previous value
        const previousData = queryClient.getQueryData([resourceKey, queryType]);

        // Optimistically update
        queryClient.setQueryData([resourceKey, queryType], (old) => updateFn(old, newData));

        return { previousData };
      },
      onError: (err, newData, context) => {
        // Rollback on error
        queryClient.setQueryData([resourceKey, queryType], context.previousData);
        options.onError?.(err, newData, context);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: [resourceKey] });
      },
      onSuccess: options.onSuccess,
    });
  }

  /**
   * Prefetch list data
   */
  function usePrefetchList(params = {}) {
    const queryClient = useQueryClient();

    return () => {
      queryClient.prefetchQuery({
        queryKey: [resourceKey, 'list', params],
        queryFn: () => api.list(params).then(transformList),
      });
    };
  }

  /**
   * Prefetch single item
   */
  function usePrefetchItem(id) {
    const queryClient = useQueryClient();

    return () => {
      if (id) {
        queryClient.prefetchQuery({
          queryKey: [resourceKey, 'detail', id],
          queryFn: () => api.get(id).then(transformItem),
        });
      }
    };
  }

  /**
   * Invalidate all queries for this resource
   */
  function useInvalidate() {
    const queryClient = useQueryClient();
    return () => queryClient.invalidateQueries({ queryKey: [resourceKey] });
  }

  return {
    useList,
    useGet,
    useCreate,
    useUpdate,
    useDelete,
    useBulkDelete,
    useOptimisticUpdate,
    usePrefetchList,
    usePrefetchItem,
    useInvalidate,
    resourceKey,
  };
}

/**
 * Pre-built API factory for common patterns
 * Creates an API object that works with useCRUD
 */
export function createAPIService(axiosInstance, baseUrl) {
  return {
    list: (params = {}) => axiosInstance.get(baseUrl, { params }),
    get: (id) => axiosInstance.get(`${baseUrl}/${id}`),
    create: (data) => axiosInstance.post(baseUrl, data),
    update: (id, data) => axiosInstance.put(`${baseUrl}/${id}`, data),
    delete: (id) => axiosInstance.delete(`${baseUrl}/${id}`),
    bulkDelete: (ids) => axiosInstance.delete(`${baseUrl}/bulk`, { data: { ids } }),
    bulkCreate: (items) => axiosInstance.post(`${baseUrl}/bulk`, { items }),
  };
}

/**
 * Pagination helper hook
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const nextPage = () => setPage(p => p + 1);
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const goToPage = (p) => setPage(p);
  const changeLimit = (l) => {
    setLimit(l);
    setPage(1); // Reset to first page when changing limit
  };

  return {
    page,
    limit,
    nextPage,
    prevPage,
    goToPage,
    changeLimit,
    params: { page, limit },
  };
}

// Need to import useState for usePagination
import { useState } from 'react';

export default createCRUDHooks;
