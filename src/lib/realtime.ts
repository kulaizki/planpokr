import { supabase } from '$lib/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';
import type { VoteValue } from '$lib/types/game';

type GameRow = Database['public']['Tables']['games']['Row'];
type PlayerRow = Database['public']['Tables']['players']['Row'];
type VoteRow = Database['public']['Tables']['votes']['Row'];

type PresenceEventPayload = {
  newPresences?: Record<string, unknown>[];
  leftPresences?: Record<string, unknown>[];
};

type VotePayload = { 
  playerId: string; 
  value: VoteValue;
};

type StoryUpdatePayload = { 
  story: string;
};

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

// Function to create a game channel with presence support
export function createPresenceChannel(
  gameId: string, 
  playerId: string,
  onJoin?: (payload: PresenceEventPayload) => void,
  onLeave?: (payload: PresenceEventPayload) => void,
  onStatus?: (status: string) => void
): RealtimeChannel {
  const channel = supabase.channel(`presence:${gameId}`, {
    config: {
      presence: {
        key: playerId,
      },
    },
  });

  if (onJoin) {
    channel.on('presence', { event: 'join' }, onJoin);
  }
  
  if (onLeave) {
    channel.on('presence', { event: 'leave' }, onLeave);
  }

  channel.subscribe((status) => {
    if (onStatus) {
      onStatus(status);
    }
  });

  return channel;
}

// Function to subscribe to custom broadcast events
export function subscribeToBroadcast(
  gameId: string,
  eventName: string,
  callback: (payload: Record<string, unknown>) => void
): RealtimeChannel {
  const channel = supabase
    .channel(`broadcast:${gameId}:${eventName}`)
    .on('broadcast', { event: eventName }, callback)
    .subscribe();

  return channel;
}

// Function to send broadcast events
export function broadcast(
  gameId: string,
  eventName: string,
  payload: Record<string, unknown>
): void {
  supabase.channel(`broadcast:${gameId}:${eventName}`).send({
    type: 'broadcast',
    event: eventName,
    payload
  });
}

// Create a combined game channel that handles postgres changes, presence, and broadcasts
export function createGameChannel(
  gameId: string,
  playerId: string,
  playerName: string,
  callbacks: {
    onStatus?: (status: string) => void,
    onPlayerJoin?: (payload: PresenceEventPayload) => void,
    onPlayerLeave?: (payload: PresenceEventPayload) => void,
    onVote?: (payload: { payload: VotePayload }) => void,
    onStoryUpdate?: (payload: { payload: StoryUpdatePayload }) => void,
    onReveal?: (payload: Record<string, unknown>) => void,
    onResetVotes?: (payload: Record<string, unknown>) => void,
    onPlayerChange?: () => void,
    onVoteChange?: () => void,
    onGameChange?: () => void
  }
): RealtimeChannel {
  const channel = supabase.channel(`game:${gameId}`, {
    config: {
      presence: {
        key: playerId,
      },
    },
  });

  // Set up presence handlers
  if (callbacks.onPlayerJoin) {
    channel.on('presence', { event: 'join' }, callbacks.onPlayerJoin);
  }
  
  if (callbacks.onPlayerLeave) {
    channel.on('presence', { event: 'leave' }, callbacks.onPlayerLeave);
  }

  // Set up broadcast event handlers
  if (callbacks.onVote) {
    channel.on('broadcast', { event: 'vote' }, callbacks.onVote);
  }
  
  if (callbacks.onStoryUpdate) {
    channel.on('broadcast', { event: 'story_update' }, callbacks.onStoryUpdate);
  }
  
  if (callbacks.onReveal) {
    channel.on('broadcast', { event: 'reveal' }, callbacks.onReveal);
  }
  
  if (callbacks.onResetVotes) {
    channel.on('broadcast', { event: 'reset_votes' }, callbacks.onResetVotes);
  }

  // Set up postgres changes handlers
  if (callbacks.onPlayerChange) {
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players',
      filter: `game_id=eq.${gameId}`
    }, callbacks.onPlayerChange);
  }
  
  if (callbacks.onVoteChange) {
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'votes',
      filter: `game_id=eq.${gameId}`
    }, callbacks.onVoteChange);
  }
  
  if (callbacks.onGameChange) {
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'games',
      filter: `id=eq.${gameId}`
    }, callbacks.onGameChange);
  }

  // Subscribe to the channel
  channel.subscribe((status) => {
    if (callbacks.onStatus) {
      callbacks.onStatus(status);
    }
    
    // Track presence when subscribed
    if (status === 'SUBSCRIBED') {
      channel.track({
        player_id: playerId,
        name: playerName,
        online_at: new Date().toISOString(),
      });
    }
  });

  return channel;
}

// Function to unsubscribe from channels
export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
} 