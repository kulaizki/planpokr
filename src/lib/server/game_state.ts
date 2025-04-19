import Ws from 'ws'; 

export interface Player {
    id: string;
    name: string;
    ws: Ws; 
}

export interface GameState {
    id: string;
    players: Player[];
    currentStory: string;
    votes: { [playerId: string]: string | number | null }; 
    revealed: boolean;
}

export const games = new Map<string, GameState>(); 