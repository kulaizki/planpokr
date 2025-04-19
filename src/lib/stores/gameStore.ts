import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';

interface PlayerInfo {
  id: string;
  name: string;
  voted: boolean;
}

interface ClientGameState {
  id: string | null;
  players: PlayerInfo[];
  currentStory: string;
  votes: { [playerId: string]: string | number | null };
  revealed: boolean;
  myName: string;
  myId: string | null;
  allVoted: boolean;
}

type VoteValue = string | number | null;
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export function createGameStore(gameId: string, playerName: string) {
  // Generate a unique player ID
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Create a writable store with initial state
  const gameState = writable<ClientGameState>({
    id: gameId,
    players: [],
    currentStory: 'No story set yet.',
    votes: {},
    revealed: false,
    myName: playerName,
    myId: playerId,
    allVoted: false
  });

  // Connection status management
  const connectionStatus = writable<ConnectionStatus>('connecting');

  // Initialize the game in Supabase
  async function initializeGame() {
    try {
      connectionStatus.set('connecting');
      
      // Check if game exists
      const { data: existingGame } = await supabase
        .from('games')
        .select('*')
        .eq('id', gameId)
        .single();
      
      if (!existingGame) {
        // Create new game if it doesn't exist
        await supabase.from('games').insert({
          id: gameId,
          current_story: 'No story set yet.',
          revealed: false
        });
      }
      
      // Add player to players table
      await supabase.from('players').insert({
        id: playerId,
        game_id: gameId,
        name: playerName,
        voted: false
      });
      
      // Initialize vote
      await supabase.from('votes').insert({
        player_id: playerId,
        game_id: gameId,
        value: null
      });
      
      connectionStatus.set('connected');
      
      // Set up realtime channels
      setupRealtimeChannels();
    } catch (error) {
      console.error('Error initializing game:', error);
      connectionStatus.set('error');
    }
  }
  
  // Set up Supabase Realtime channels for game updates
  function setupRealtimeChannels() {
    // Create a channel for this game room
    const channel = supabase.channel(`game:${gameId}`, {
      config: {
        presence: {
          key: playerId,
        },
      },
    });

    // Track player presence
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('Players joined:', newPresences);
    }).on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('Players left:', leftPresences);
      // Remove players who left
      if (leftPresences.length > 0) {
        leftPresences.forEach(async (presence) => {
          try {
            // Delete player record
            await supabase
              .from('players')
              .delete()
              .eq('id', presence.key);
            
            // Delete vote record  
            await supabase
              .from('votes')
              .delete()
              .eq('player_id', presence.key);
          } catch (error) {
            console.error('Error removing player:', error);
          }
        });
      }
    });

    // Set up broadcast listeners for game events
    channel.on('broadcast', { event: 'vote' }, ({ payload }) => {
      updateVote(payload.playerId, payload.value);
    }).on('broadcast', { event: 'story_update' }, ({ payload }) => {
      updateStory(payload.story);
    }).on('broadcast', { event: 'reveal' }, () => {
      revealVotes();
    });

    // Handle postgres changes for database state
    channel.on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'players',
      filter: `game_id=eq.${gameId}`
    }, async () => {
      await refreshPlayers();
    }).on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'votes',
      filter: `game_id=eq.${gameId}`
    }, async () => {
      await refreshVotes();
    }).on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'games',
      filter: `id=eq.${gameId}`
    }, async () => {
      await refreshGameState();
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`Channel status: ${status}`);
      if (status === 'SUBSCRIBED') {
        connectionStatus.set('connected');
        
        // Only track presence after subscription is complete
        channel.track({
          player_id: playerId,
          name: playerName,
          online_at: new Date().toISOString(),
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        connectionStatus.set('disconnected');
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }

  // Helper functions to refresh data
  async function refreshPlayers() {
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error fetching players:', error);
      return;
    }
    
    if (players) {
      console.log('Players refreshed:', players);
      gameState.update(state => ({
        ...state,
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          voted: p.voted
        }))
      }));
    }
  }

  async function refreshVotes() {
    const { data: votes, error } = await supabase
      .from('votes')
      .select('*')
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error fetching votes:', error);
      return;
    }
    
    if (votes) {
      console.log('Votes refreshed:', votes);
      const votesMap: Record<string, VoteValue> = {};
      
      votes.forEach(v => {
        votesMap[v.player_id] = v.value;
      });
      
      const allVoted = votes.length > 0 && votes.every(v => v.value !== null);
      
      gameState.update(state => ({
        ...state,
        votes: votesMap,
        allVoted
      }));
    }
  }

  async function refreshGameState() {
    const { data: game, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();
    
    if (error) {
      console.error('Error fetching game state:', error);
      return;
    }
    
    if (game) {
      console.log('Game state refreshed:', game);
      gameState.update(state => ({
        ...state,
        currentStory: game.current_story,
        revealed: game.revealed
      }));
    }
  }

  // Helper functions for local updates
  function updateVote(pid: string, value: VoteValue) {
    gameState.update(state => {
      const players = state.players.map(p => 
        p.id === pid ? { ...p, voted: true } : p
      );
      const votes = { ...state.votes, [pid]: value };
      return { ...state, players, votes };
    });
  }

  function updateStory(story: string) {
    gameState.update(state => ({
      ...state,
      currentStory: story, 
      revealed: false
    }));
  }

  function revealVotes() {
    gameState.update(state => ({
      ...state,
      revealed: true
    }));
  }
  
  // Cast a vote
  async function vote(value: string | number) {
    try {
      // Update player's voted status
      await supabase
        .from('players')
        .update({ voted: true })
        .eq('id', playerId);
      
      // Update vote
      await supabase
        .from('votes')
        .update({ value })
        .eq('player_id', playerId)
        .eq('game_id', gameId);
      
      // Broadcast the vote event to other players
      supabase.channel(`game:${gameId}`).send({
        type: 'broadcast',
        event: 'vote',
        payload: { playerId, value }
      });
      
      // Refresh votes to update local state
      await refreshVotes();
      
      // Check if all players have voted and automatically reveal if so
      const { data: allPlayers } = await supabase
        .from('players')
        .select('voted')
        .eq('game_id', gameId);
        
      const { data: allVotes } = await supabase
        .from('votes')
        .select('value')
        .eq('game_id', gameId);
        
      if (allPlayers && allVotes && 
          allPlayers.length === allVotes.length && 
          allPlayers.every(p => p.voted) && 
          allVotes.every(v => v.value !== null)) {
        // All players have voted, auto-reveal
        await reveal();
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  }
  
  // Reveal votes
  async function reveal() {
    try {
      await supabase
        .from('games')
        .update({ revealed: true })
        .eq('id', gameId);
      
      // Broadcast the reveal event
      supabase.channel(`game:${gameId}`).send({
        type: 'broadcast',
        event: 'reveal',
        payload: {}
      });
      
      // Update local state immediately
      gameState.update(state => ({
        ...state,
        revealed: true
      }));
    } catch (error) {
      console.error('Error revealing votes:', error);
    }
  }
  
  // Set story
  async function setStory(story: string) {
    try {
      // Update game
      await supabase
        .from('games')
        .update({ 
          current_story: story,
          revealed: false 
        })
        .eq('id', gameId);
      
      // Reset votes
      await supabase
        .from('votes')
        .update({ value: null })
        .eq('game_id', gameId);
      
      // Reset player voted status
      await supabase
        .from('players')
        .update({ voted: false })
        .eq('game_id', gameId);
      
      // Broadcast the story update
      supabase.channel(`game:${gameId}`).send({
        type: 'broadcast',
        event: 'story_update',
        payload: { story }
      });
    } catch (error) {
      console.error('Error setting story:', error);
    }
  }
  
  // Leave game
  async function leaveGame() {
    try {
      // Remove player
      await supabase
        .from('players')
        .delete()
        .eq('id', playerId);
      
      // Remove vote
      await supabase
        .from('votes')
        .delete()
        .eq('player_id', playerId);
      
      // Leave the channel
      supabase.channel(`game:${gameId}`).unsubscribe();
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }
  
  // Initialize
  initializeGame();
  
  return {
    gameState: {
      subscribe: gameState.subscribe
    },
    connectionStatus: {
      subscribe: connectionStatus.subscribe
    },
    vote,
    reveal,
    setStory,
    leaveGame
  };
} 