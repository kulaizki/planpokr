import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';
import type { ConnectionStatus, GameState, VoteValue } from '$lib/types/game';
import { createGameChannel, unsubscribeFromChannel } from '$lib/realtime';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function createGameStore(gameId: string, playerName: string) {
  // Generate a unique player ID
  const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Create a writable store with initial state
  const gameState = writable<GameState>({
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
  
  // Store the realtime channel reference for cleanup
  let gameChannel: RealtimeChannel | null = null;

  // Initialize the game in Supabase
  async function initializeGame() {
    try {
      connectionStatus.set('connecting');
      
      // Check if game exists
      const { data: existingGame, error: gameError } = await supabase
        .from('games')
        .select('id') // Select only id to check existence
        .eq('id', gameId)
        .maybeSingle(); 
        
      if (gameError && gameError.code !== 'PGRST116') { 
        throw gameError;
      }
      
      if (!existingGame) {
        // Create new game if it doesn't exist
        const { error: insertGameError } = await supabase.from('games').insert({
          id: gameId,
          current_story: 'No story set yet.',
          revealed: false
        });
        if (insertGameError) throw insertGameError;
      }
      
      // Add player to players table or update existing (upsert)
      const { error: playerError } = await supabase.from('players').upsert({
        id: playerId,
        game_id: gameId,
        name: playerName,
        voted: false // Ensure voted is false on join/rejoin
      });
      if (playerError) throw playerError;
      
      // Initialize or update vote (upsert)
      const { error: voteError } = await supabase.from('votes').upsert({
        player_id: playerId,
        game_id: gameId,
        value: null // Ensure vote is null on join/rejoin
      }, { onConflict: 'game_id, player_id' }); // Specify conflict target
      if (voteError) throw voteError;
      
      // Fetch initial game state immediately after joining/setup
      await refreshAllGameData();
      
      connectionStatus.set('connected');
      
      // Set up realtime channels using the modular approach
      setupRealtimeChannels();
      
    } catch (error) {
      console.error('Error initializing game:', error);
      connectionStatus.set('error');
    }
  }
  
  // Set up Supabase Realtime channels for game updates using the realtime.ts module
  function setupRealtimeChannels() {
    // Create a unified game channel with all handlers
    gameChannel = createGameChannel(gameId, playerId, playerName, {
      // Connection status handling
      onStatus: (status) => {
        console.log(`Channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          connectionStatus.set('connected');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          connectionStatus.set('disconnected');
        }
      },
      
      // Presence handlers
      onPlayerJoin: async ({ newPresences }) => {
        console.log('Players joined:', newPresences);
        await refreshAllGameData();
      },
      
      onPlayerLeave: async ({ leftPresences }) => {
        console.log('Players left:', leftPresences);
        // Remove players who left
        if (leftPresences && leftPresences.length > 0) {
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
      },
      
      // Broadcast event handlers
      onVote: (payload) => {
        updateVote(payload.payload.playerId, payload.payload.value);
      },
      
      onStoryUpdate: (payload) => {
        updateStory(payload.payload.story);
      },
      
      onReveal: () => {
        revealVotes();
      },
      
      onResetVotes: () => {
        refreshAllGameData();
      },
      
      // Postgres changes handlers
      onPlayerChange: async () => {
        await refreshAllGameData();
      },
      
      onVoteChange: async () => {
        await refreshAllGameData();
      },
      
      onGameChange: async () => {
        await refreshAllGameData();
      }
    });
  }

  // Optimized function to refresh all game data in one update
  async function refreshAllGameData() {
    try {
      const [playersResult, votesResult, gameResult] = await Promise.all([
        supabase.from('players').select('*').eq('game_id', gameId),
        supabase.from('votes').select('*').eq('game_id', gameId),
        supabase.from('games').select('*').eq('id', gameId).single()
      ]);
      
      // Check for errors
      if (playersResult.error) console.error('Error fetching players:', playersResult.error);
      if (votesResult.error) console.error('Error fetching votes:', votesResult.error);
      if (gameResult.error) console.error('Error fetching game:', gameResult.error);
      
      // Prepare data
      const players = playersResult.data || [];
      const votes = votesResult.data || [];
      const game = gameResult.data;
      
      // Process votes
      const votesMap: Record<string, VoteValue> = {};
      votes.forEach(v => {
        votesMap[v.player_id] = v.value;
      });
      
      const allVoted = votes.length > 0 && votes.every(v => v.value !== null);
      
      // Update state in a single operation to avoid multiple redraws
      gameState.update(state => ({
        ...state,
        // Players data
        players: players.map(p => ({
          id: p.id,
          name: p.name,
          voted: p.voted
        })),
        // Votes data
        votes: votesMap,
        allVoted,
        // Game data (if available)
        ...(game ? {
          currentStory: game.current_story,
          revealed: game.revealed
        } : {})
      }));
    } catch (error) {
      console.error('Error refreshing all game data:', error);
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
      await refreshAllGameData();
      
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
      // Update game state in DB
      await supabase
        .from('games')
        .update({ 
          current_story: story,
          revealed: false 
        })
        .eq('id', gameId);
      
      // Reset votes in DB
      await supabase
        .from('votes')
        .update({ value: null })
        .eq('game_id', gameId);
      
      // Reset player voted status in DB
      await supabase
        .from('players')
        .update({ voted: false })
        .eq('game_id', gameId);
      
      // --- Immediate Local State Update --- 
      // Update local state *immediately* to reflect the reset for a faster UI response
      gameState.update(state => {
        const updatedPlayers = state.players.map(p => ({ ...p, voted: false }));
        return {
          ...state,
          currentStory: story || 'No story set yet.', // Ensure story isn't empty string locally
          revealed: false,
          votes: {}, // Clear local votes map
          allVoted: false,
          players: updatedPlayers // Update player voted status locally
        };
      });
      
      // Broadcast the story update event and vote reset events
      const channel = supabase.channel(`game:${gameId}`);
      
      // Broadcast a specific reset_votes event to ensure all clients update player status
      channel.send({
        type: 'broadcast',
        event: 'reset_votes',
        payload: { resetBy: playerId }
      });
      
      // Also broadcast the story update
      channel.send({
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
      
      // Clean up the realtime channel
      if (gameChannel) {
        unsubscribeFromChannel(gameChannel);
        gameChannel = null;
      }
    } catch (error) {
      console.error('Error leaving game:', error);
    }
  }
  
  async function resetVotes() {
    try {
      // First update the game state to set revealed to false
      const { error: gameError } = await supabase
        .from('games')
        .update({ 
          revealed: false 
        })
        .eq('id', gameId);
      
      if (gameError) throw gameError;
      
      // Reset all player voted status
      const { error: playerError } = await supabase
        .from('players')
        .update({ voted: false })
        .eq('game_id', gameId);
      
      if (playerError) throw playerError;
      
      // Reset all votes to null
      const { error: voteError } = await supabase
        .from('votes')
        .update({ value: null })
        .eq('game_id', gameId);
      
      if (voteError) throw voteError;
      
      // Broadcast the reset event to all clients
      const channel = supabase.channel(`game:${gameId}`);
      channel.send({
        type: 'broadcast',
        event: 'reset_votes',
        payload: {}
      });
      
      // Update local state
      gameState.update(state => ({
        ...state,
        votes: {},
        revealed: false,
        allVoted: false
      }));
      
    } catch (error) {
      console.error('Error resetting votes:', error);
    }
  }
  
  /**
   * Prepare the store for a reset operation
   * This optimizes the state transition
   */
  function prepareForReset() {
    // Immediately update local state to prevent UI flashing
    gameState.update(state => ({
      ...state,
      revealed: false,
      allVoted: false
    }));
  }
  
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
    leaveGame,
    resetVotes,
    prepareForReset
  };
} 