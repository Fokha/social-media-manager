import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Login failed'
          };
        }
      },

      register: async (email, password, firstName, lastName) => {
        set({ isLoading: true });
        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            firstName,
            lastName
          });
          const { user, token } = response.data.data;

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            error: error.response?.data?.error || 'Registration failed'
          };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete api.defaults.headers.common['Authorization'];
      },

      fetchUser: async () => {
        const token = get().token;
        if (!token) return;

        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await api.get('/auth/me');
          set({ user: response.data.data.user, isAuthenticated: true });
        } catch (error) {
          get().logout();
        }
      },

      updateProfile: async (data) => {
        try {
          const response = await api.put('/auth/profile', data);
          set({ user: response.data.data.user });
          return { success: true };
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.error || 'Update failed'
          };
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);

export default useAuthStore;
