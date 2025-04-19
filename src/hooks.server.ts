import type { Handle } from '@sveltejs/kit';
import Ws, { WebSocketServer } from 'ws'; 
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type { Buffer } from 'node:buffer';
import { type GameState, type Player, games } from '$lib/server/game_state'; 

console.log('Setting up WebSocket server...');

const wss = new WebSocketServer({ noServer: true });

interface BroadcastMessage {
    type: string;
    payload?: unknown; 
}

wss.on('connection', (ws: Ws, request: IncomingMessage) => { 
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const gameIdMatch = url.pathname.match(/^\/ws\/game\/([a-zA-Z0-9-]+)$/);
    const gameId = gameIdMatch ? gameIdMatch[1] : null;

    if (!gameId) {
        console.log('WS connection without valid gameId, closing.');
        ws.close();
        return;
    }

    console.log(`Client connected to game: ${gameId}`);

    if (!games.has(gameId)) {
        games.set(gameId, {
            id: gameId,
            players: [],
            currentStory: '',
            votes: {},
            revealed: false,
        });
    }
    const game = games.get(gameId) as GameState;

    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerName = url.searchParams.get('name') || `Anon_${playerId.slice(-4)}`;

    const newPlayer: Player = { id: playerId, name: playerName, ws };
    game.players.push(newPlayer);
    game.votes[playerId] = null;

    // Prepare players list without ws objects for sending
    const playersForClient = game.players.map(p => ({ id: p.id, name: p.name }));

    // Send initial game state
    ws.send(JSON.stringify({ type: 'GAME_STATE', payload: { ...game, players: playersForClient } }));

    // Notify others
    broadcast(gameId, { type: 'PLAYER_JOINED', payload: { id: playerId, name: playerName } }, ws);

    ws.on('message', (message: Buffer | string) => { 
        try {
            const messageString = message.toString();
            const parsedMessage = JSON.parse(messageString);
            console.log('Received:', parsedMessage);

            // check for player existence
            const currentPlayer = game.players.find(p => p.id === playerId);
            if (!currentPlayer) return; 

            switch (parsedMessage.type) {
                case 'VOTE':
                    game.votes[playerId] = parsedMessage.payload.vote;
                    broadcast(gameId, { type: 'PLAYER_VOTED', payload: { playerId } });
                    if (Object.values(game.votes).every(vote => vote !== null)) {
                       broadcast(gameId, { type: 'ALL_VOTED' });
                    }
                    break;
                case 'REVEAL':
                    game.revealed = true;
                    broadcast(gameId, { type: 'REVEAL_VOTES', payload: game.votes });
                    break;
                case 'NEXT_STORY':
                case 'SET_STORY': 
                    game.currentStory = parsedMessage.payload.story || '';
                    game.revealed = false;
                    Object.keys(game.votes).forEach(pid => game.votes[pid] = null);
                    broadcast(gameId, { type: parsedMessage.type === 'SET_STORY' ? 'STORY_SET' : 'NEW_STORY', payload: { story: game.currentStory, votes: game.votes } });
                    break;
            }
        } catch (e) {
            console.error('Failed to parse message or handle:', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected from game: ${gameId}`);
        const index = game.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            game.players.splice(index, 1);
            delete game.votes[playerId];
            broadcast(gameId, { type: 'PLAYER_LEFT', payload: { playerId } });
        }
    });

    ws.on('error', (error: Error) => { 
        console.error(`WebSocket error for ${playerId}:`, error);
        const index = game.players.findIndex(p => p.id === playerId);
         if (index !== -1) {
            game.players.splice(index, 1);
            delete game.votes[playerId];
            broadcast(gameId, { type: 'PLAYER_LEFT', payload: { playerId } });
         }
    });
});

// Broadcast helper function
export function broadcast(gameId: string, message: BroadcastMessage, senderWs?: Ws) {
    const game = games.get(gameId);
    if (!game) return;

    const messageString = JSON.stringify(message);
    game.players.forEach((player: Player) => { // Explicitly type player
        // Use Ws.OPEN constant and ensure types match
        if (player.ws !== senderWs && player.ws.readyState === Ws.OPEN) {
            try {
                player.ws.send(messageString);
            } catch (e) {
                 console.error(`Failed to send message to player ${player.id}:`, e);
            }
        }
    });
}

// SvelteKit handle hook
export const handle: Handle = async ({ event, resolve }) => {
    // @ts-expect-error - Use expect-error and check if platform type needs adjustment
    const viteDevServer = event.platform?.viteDevServer ?? globalThis.viteDevServer;

     if (viteDevServer && viteDevServer.httpServer) {
        const httpServer = viteDevServer.httpServer;
        // Add listener only once
        if (!httpServer.listenerCount('upgrade')) {
             console.log('Attaching WebSocket upgrade listener...');
            httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
                 console.log('Upgrade event received for path:', request.url);
                 const url = new URL(request.url || '', `http://${request.headers.host}`);
                if (url.pathname.startsWith('/ws/game/')) {
                     console.log('Handling upgrade for game path...');
                    wss.handleUpgrade(request, socket, head, (ws: Ws) => {
                        wss.emit('connection', ws, request);
                    });
                 } else {
                     console.log('Upgrade for non-game path, destroying socket.');
                     socket.destroy();
                 }
            });
            console.log('WebSocket upgrade listener attached.');
        }
     } else if (import.meta.env.PROD) { 
         console.warn('HTTP server not available via event.platform.viteDevServer. WebSockets may not work in this production environment without specific adapter configuration.');
     }

    return resolve(event);
};

console.log('WebSocket server setup complete.'); 