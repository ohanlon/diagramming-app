/**
 * Authentication API hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, User } from '../types';

export const authKeys = {
  currentUser: ['auth', 'currentUser'] as const,
  all: ['auth'] as const,
};

/**
 * Get current authenticated user
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.currentUser,
    queryFn: async (): Promise<User | null> => {
      try {
        const response = await api.get<LoginResponse>('/auth/me');
        return response.user;
      } catch (error) {
        // If 401, user is not authenticated
        return null;
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<User> => {
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      
      // Fetch avatar if exists
      let avatarUrl = response.user.avatarUrl;
      if (avatarUrl) {
        try {
          const avatarResp = await fetch(avatarUrl, { credentials: 'include' });
          if (avatarResp.ok) {
            const blob = await avatarResp.blob();
            avatarUrl = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn('Failed to fetch avatar:', e);
        }
      }

      return { ...response.user, avatarUrl };
    },
    onSuccess: (user) => {
      // Update current user cache
      queryClient.setQueryData(authKeys.currentUser, user);
    },
  });
}

/**
 * Register mutation
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<User> => {
      const { getServerUrl } = await import('../client');
      const serverUrl = getServerUrl();
      
      const formData = new FormData();
      formData.append('username', data.username);
      formData.append('email', data.email);
      formData.append('password', data.password);
      if (data.avatarFile) {
        formData.append('avatar', data.avatarFile);
      }

      const response = await fetch(`${serverUrl}/auth/register`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }

      const result: RegisterResponse = await response.json();

      // Fetch avatar if exists
      let avatarUrl = result.user.avatarUrl;
      if (avatarUrl) {
        try {
          const avatarResp = await fetch(avatarUrl, { credentials: 'include' });
          if (avatarResp.ok) {
            const blob = await avatarResp.blob();
            avatarUrl = URL.createObjectURL(blob);
          }
        } catch (e) {
          console.warn('Failed to fetch avatar:', e);
        }
      }

      return { ...result.user, avatarUrl };
    },
    onSuccess: (user) => {
      // Update current user cache
      queryClient.setQueryData(authKeys.currentUser, user);
    },
  });
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await api.post('/auth/logout');
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Explicitly set current user to null
      queryClient.setQueryData(authKeys.currentUser, null);
    },
  });
}

/**
 * Refresh token (usually called automatically by API client)
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: async (): Promise<boolean> => {
      try {
        await api.post('/auth/refresh');
        return true;
      } catch (error) {
        return false;
      }
    },
  });
}
