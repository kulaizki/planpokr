/**
 * Game-related type definitions
 */

export interface PlayerInfo {
	id: string;
	name: string;
	voted: boolean;
}

export interface ClientGameState {
	id: string | null;
	players: PlayerInfo[];
	currentStory: string;
	votes: { [playerId: string]: string | number | null };
	revealed: boolean;
	myName: string;
	myId: string | null; 
	allVoted: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
export type VoteValue = string | number | null; 