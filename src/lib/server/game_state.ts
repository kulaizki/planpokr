import type WebSocket from 'ws';

export interface Player {
    id: string;
    name: string;
    ws: WebSocket; // Reference to the WebSocket connection
}

// Represents the state of a single game room
export interface GameState {
    id: string;
    players: Player[];
    currentStory: string;
    votes: { [playerId: string]: string | number | null }; // Store votes (null if not voted)
    revealed: boolean; // Are votes currently revealed?
}

// In-memory store for active games (Map<gameId, GameState>)
// NOTE: This is simple and will be lost on server restart.
// For persistence, use a database or external store like Redis.
export const games = new Map<string, GameState>(); 