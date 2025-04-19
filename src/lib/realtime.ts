import { supabase } from '$lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

type GameRow = Database['public']['Tables']['games']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type VoteRow = Database['public']['Tables']['votes']['Row'];

// Generic function to subscribe to realtime changes
export function subscribeToChanges<T extends Record<string, unknown>>(
  table: string,
  gameId: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter: `game_id=eq.${gameId}`
      },
      (payload) => callback(payload as RealtimePostgresChangesPayload<T>)
    )
    .subscribe();

  return channel;
}

// Game-specific subscription functions
export function subscribeToGame(
  gameId: string,
  callback: (payload: RealtimePostgresChangesPayload<GameRow>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`game-changes:${gameId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      },
      (payload) => callback(payload as RealtimePostgresChangesPayload<GameRow>)
    )
    .subscribe();

  return channel;
}

export function subscribeToPlayers(
  gameId: string,
  callback: (payload: RealtimePostgresChangesPayload<PlayerRow>) => void
): RealtimeChannel {
  return subscribeToChanges<PlayerRow>('players', gameId, callback);
}

export function subscribeToVotes(
  gameId: string,
  callback: (payload: RealtimePostgresChangesPayload<VoteRow>) => void
): RealtimeChannel {
  return subscribeToChanges<VoteRow>('votes', gameId, callback);
}

// Function to unsubscribe from channels
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
} 