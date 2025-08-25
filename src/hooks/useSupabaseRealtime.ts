import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

interface UseSupabaseRealtimeProps<T> {
  channelName: string;
  tableName: string;
  onRecordUpdated: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useSupabaseRealtime<T>({
  channelName,
  tableName,
  onRecordUpdated,
}: UseSupabaseRealtimeProps<T>) {
  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on<T>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: tableName,
        },
        (payload) => {
          onRecordUpdated(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, tableName, onRecordUpdated]);
}