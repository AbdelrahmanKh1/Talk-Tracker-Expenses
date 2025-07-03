import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UserSettings {
  id: string;
  user_id: string;
  full_name: string | null;
  active_currency: string;
  base_currency: string | null;
  preferred_currency: string | null;
  theme: string | null;
  created_at: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['userSettings', user?.id],
    queryFn: async (): Promise<UserSettings | null> => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If the table doesn't exist or there's no record, return null
        if (error.code === 'PGRST116' || error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching user settings:', error);
        throw error;
      }

      return data;
    },
    enabled: !!user,
  });

  const updateUserSettings = useMutation({
    mutationFn: async (updates: Partial<UserSettings>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_settings')
        .upsert([
          {
            user_id: user.id,
            ...updates
          }
        ], {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
      toast.success('Settings updated successfully!');
    },
    onError: (error) => {
      console.error('Error updating user settings:', error);
      toast.error('Failed to update settings');
    },
  });

  const getUserName = (): string => {
    if (settings?.full_name) {
      return settings.full_name;
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  return {
    settings,
    isLoading,
    error,
    updateUserSettings: updateUserSettings.mutate,
    isUpdating: updateUserSettings.isPending,
    getUserName,
  };
}; 