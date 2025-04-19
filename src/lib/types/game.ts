/**
 * Game-related type definitions for the planning poker application
 */

/**
 * Player information
 */
export interface PlayerInfo {
	id: string;
	name: string;
	voted: boolean;
}

/**
 * Complete client-side game state
 */
export interface GameState {
	id: string | null;
	players: PlayerInfo[];
	currentStory: string;
	votes: { [playerId: string]: string | number | null };
	revealed: boolean;
	myName: string;
	myId: string | null; 
	allVoted: boolean;
}

// Type alias for backward compatibility
export type ClientGameState = GameState;

/**
 * Connection status values
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Type alias for backward compatibility
export type ConnectionStatusType = ConnectionStatus;

/**
 * Vote value types
 */
export type VoteValue = string | number | null; 