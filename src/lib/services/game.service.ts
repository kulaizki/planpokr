import { createGameStore } from '$lib/stores/gameStore';
import { writable } from 'svelte/store';
import type { ConnectionStatus, GameState, VoteValue } from '$lib/types/game';

/**
 * Copies the current game link to the clipboard
 * @param setButtonText Function to update button text
 */
export async function copyGameLink(setButtonText: (text: string) => void): Promise<void> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    setButtonText('Copied!');
    setTimeout(() => { setButtonText('Copy Invite Link'); }, 2000);
  } catch (err) {
    console.error('Failed to copy link:', err);
    // Try fallback method for browsers that don't support clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = window.location.href;
    textarea.style.position = 'fixed';  // Prevent scrolling to bottom
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setButtonText('Copied!');
      } else {
        setButtonText('Failed to copy');
      }
    } catch (err) {
      console.error('Fallback copy failed:', err);
      setButtonText('Failed to copy');
    }
    
    document.body.removeChild(textarea);
    setTimeout(() => { setButtonText('Copy Invite Link'); }, 2000);
  }
}

/**
 * Initializes the game with the player's name
 * @param gameId The ID of the game to join
 * @param nameInput The player's name
 * @returns The game store and unsubscribe functions
 */
export function initializeGame(gameId: string, nameInput: string) {
  // Default name if empty
  const name = nameInput.trim() ? nameInput : 'Anonymous';
  
  // Initialize stores
  const currentVote = writable<VoteValue>(null);
  const status = writable<ConnectionStatus>('connecting');
  const gameStateStore = writable<GameState>({
    id: null,
    players: [],
    currentStory: '',
    votes: {},
    revealed: false,
    myName: '',
    myId: null,
    allVoted: false
  });
  
  // Initialize the game store
  const gameStore = createGameStore(gameId, name);
  
  // Watch connection status and game state
  const statusUnsub = gameStore.connectionStatus.subscribe(value => {
    status.set(value);
  });
  
  const stateUnsub = gameStore.gameState.subscribe(value => {
    gameStateStore.set(value);
  });
  
  return {
    gameStore,
    currentVote,
    status,
    gameStateStore,
    unsubscribe: () => {
      statusUnsub();
      stateUnsub();
      gameStore.leaveGame();
    }
  };
}

/**
 * Handle voting action
 * @param gameStore The game store instance
 * @param currentVote The current vote store
 * @param vote The vote value
 */
export function handleVote(
  gameStore: ReturnType<typeof createGameStore>,
  currentVote: ReturnType<typeof writable<VoteValue>>,
  vote: string | number
): void {
  currentVote.set(vote);
  gameStore.vote(vote);
}

/**
 * Handle setting a new story
 * @param gameStore The game store instance
 * @param storyInput The story input text
 * @returns The updated story input (empty string)
 */
export function handleSetStory(
  gameStore: ReturnType<typeof createGameStore>,
  storyInput: string
): string {
  if (storyInput.trim()) {
    gameStore.setStory(storyInput.trim());
    return '';
  }
  return storyInput;
}

/**
 * Handle moving to the next story
 * @param gameStore The game store instance
 * @returns Empty string to clear the story input
 */
export function handleNextStory(gameStore: ReturnType<typeof createGameStore>): string {
  gameStore.resetVotes(); // Reset all votes first
  gameStore.setStory(''); // Then set empty story
  return '';
} 