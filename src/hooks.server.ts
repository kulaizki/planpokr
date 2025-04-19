import type { Handle } from '@sveltejs/kit';
import Ws, { WebSocketServer } from 'ws'; 
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type { Buffer } from 'node:buffer';
import { type GameState, type Player, games } from '$lib/server/game_state'; 
import { handleUpgrade } from '$lib/server/websocket'; // Import the handler

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

// Keep track if the listener has been attached to avoid duplicates during HMR
let upgradeListenerAttached = false;

export const handle: Handle = async ({ event, resolve }) => {
    // @ts-expect-error - Accessing platform internals for Vite server
    const viteDevServer = event.platform?.viteDevServer ?? globalThis.viteDevServer;

    if (viteDevServer && viteDevServer.httpServer) {
        const httpServer = viteDevServer.httpServer;

        if (!upgradeListenerAttached) {
            console.log('[handle] Attaching WebSocket upgrade listener...');
            httpServer.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
                const url = new URL(request.url || '', `http://${request.headers.host}`);

                // Only handle upgrades for our specific websocket path
                if (url.pathname.startsWith('/ws/game/')) {
                    console.log(`[handle] Upgrade request for ${url.pathname}, attempting to handle...`);
                    try {
                         handleUpgrade(request, socket, head); // Delegate to our module
                    } catch (err) {
                        console.error('[handle] Error during handleUpgrade call:', err);
                        socket.destroy();
                    }
                } else {
                    // Important: Destroy socket for paths not handled by our WS server
                    // console.log(`[handle] Upgrade for ${url.pathname} not handled, destroying socket.`);
                    socket.destroy();
                }
            });
            upgradeListenerAttached = true;
            console.log('[handle] WebSocket upgrade listener attached.');
        }
    } else if (import.meta.env.PROD) {
        console.warn('[handle] HTTP server not available. WebSockets may not work in production without specific adapter/server setup.');
    }

    return resolve(event);
};

console.log('Server hook initialized.'); // Changed log message

console.log('WebSocket server setup complete.'); 