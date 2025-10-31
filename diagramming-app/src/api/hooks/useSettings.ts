/**
 * User settings API hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client';
import type { UserSettings, UserSettingsResponse } from '../types';

export const settingsKeys = {
  all: ['settings'] as const,
  user: () => ['settings', 'user'] as const,
};

/**
 * Get user settings
 */
export function useUserSettings() {
  return useQuery({
    queryKey: settingsKeys.user(),
    queryFn: async (): Promise<UserSettings> => {
      const response = await api.get<UserSettingsResponse>('/users/me/settings');
      return response.settings || {};
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Update user settings mutation
 */
export function useUpdateUserSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>): Promise<void> => {
      // Get current settings
      const current = queryClient.getQueryData<UserSettings>(settingsKeys.user()) || {};
      
      // Merge with new settings
      const updated = { ...current, ...settings };
      
      await api.put('/users/me/settings', { settings: updated });
    },
    onMutate: async (newSettings) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: settingsKeys.user() });

      // Snapshot previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(settingsKeys.user());

      // Optimistically update
      queryClient.setQueryData<UserSettings>(settingsKeys.user(), (old) => ({
        ...old,
        ...newSettings,
      }));

      return { previousSettings };
    },
    onError: (_err, _newSettings, context) => {
      // Rollback on error
      if (context?.previousSettings) {
        queryClient.setQueryData(settingsKeys.user(), context.previousSettings);
      }
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: settingsKeys.user() });
    },
  });
}

/**
 * Update theme mode specifically (convenience hook)
 */
export function useUpdateThemeMode() {
  const updateSettings = useUpdateUserSettings();

  return useMutation({
    mutationFn: async (themeMode: 'light' | 'dark'): Promise<void> => {
      await updateSettings.mutateAsync({ themeMode });
    },
  });
}
