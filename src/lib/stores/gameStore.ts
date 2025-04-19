import { writable } from 'svelte/store';
import { supabase } from '$lib/supabase/client';

// Define local types
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
      
      // Subscribe to game changes
      subscribeToChanges();
    } catch (error) {
      console.error('Error initializing game:', error);
      connectionStatus.set('error');
    }
  }
  
  // Subscribe to real-time changes
  function subscribeToChanges() {
    // Subscribe to game table changes
    const gameSubscription = supabase
      .channel('game-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'games',
        filter: `id=eq.${gameId}`
      }, (payload) => {
        const gameData = payload.new;
        gameState.update(state => ({
          ...state,
          currentStory: gameData.current_story,
          revealed: gameData.revealed
        }));
      })
      .subscribe();
    
    // Subscribe to players table changes
    const playersSubscription = supabase
      .channel('players-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `game_id=eq.${gameId}`
      }, async () => {
        // Fetch updated players list
        const { data: players } = await supabase
          .from('players')
          .select('*')
          .eq('game_id', gameId);
        
        if (players) {
          gameState.update(state => ({
            ...state,
            players: players.map(p => ({
              id: p.id,
              name: p.name,
              voted: p.voted
            }))
          }));
        }
      })
      .subscribe();
    
    // Subscribe to votes table changes
    const votesSubscription = supabase
      .channel('votes-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'votes',
        filter: `game_id=eq.${gameId}`
      }, async () => {
        // Fetch all votes
        const { data: votes } = await supabase
          .from('votes')
          .select('*')
          .eq('game_id', gameId);
        
        if (votes) {
          const votesMap: Record<string, VoteValue> = {};
          const allVoted = votes.every(v => v.value !== null);
          
          votes.forEach(v => {
            votesMap[v.player_id] = v.value;
          });
          
          gameState.update(state => ({
            ...state,
            votes: votesMap,
            allVoted
          }));
        }
      })
      .subscribe();
    
    // Return unsubscribe function
    return () => {
      gameSubscription.unsubscribe();
      playersSubscription.unsubscribe();
      votesSubscription.unsubscribe();
    };
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