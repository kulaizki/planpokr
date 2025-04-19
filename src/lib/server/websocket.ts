import Ws, { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { Socket } from 'node:net';
import type { Buffer } from 'node:buffer';
import { games, type GameState, type Player } from '$lib/server/game_state'; // Assuming game_state is in the same dir

console.log('Initialising WebSocket Server Module...');

// Define a type for messages we broadcast
export interface BroadcastMessage {
    type: string;
    payload?: unknown;
}

// Use a symbol for a unique key on globalThis
const WEBSOCKET_SERVER_KEY = Symbol.for('app.websocketServer');

interface GlobalWithWss {
    [WEBSOCKET_SERVER_KEY]?: WebSocketServer;
}

function createWss(): WebSocketServer {
    console.log('Creating new WebSocketServer instance.');
    const wss = new WebSocketServer({ noServer: true });

    wss.on('connection', (ws: Ws, request: IncomingMessage) => {
        console.log('[WSS Connection] Client connecting...');
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const gameIdMatch = url.pathname.match(/^\/ws\/game\/([a-zA-Z0-9-]+)$/);
        const gameId = gameIdMatch ? gameIdMatch[1] : null;

        if (!gameId) {
            console.log('[WSS Connection] No valid gameId, closing.');
            ws.close();
            return;
        }
        console.log(`[WSS Connection] Client connected to game: ${gameId}`);

        // Initialize game if needed
        if (!games.has(gameId)) {
            games.set(gameId, { id: gameId, players: [], currentStory: '', votes: {}, revealed: false });
        }
        const game = games.get(gameId) as GameState;

        // Add player
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const playerName = url.searchParams.get('name') || `Anon_${playerId.slice(-4)}`;
        const newPlayer: Player = { id: playerId, name: playerName, ws };
        game.players.push(newPlayer);
        game.votes[playerId] = null;

        // Send initial state
        const playersForClient = game.players.map(p => ({ id: p.id, name: p.name }));
        ws.send(JSON.stringify({ type: 'GAME_STATE', payload: { ...game, players: playersForClient } }));
        // Notify others
        broadcast(gameId, { type: 'PLAYER_JOINED', payload: { id: playerId, name: playerName } }, ws);

        // --- Message Handling ---
        ws.on('message', (message: Buffer | string) => {
             try {
                const messageString = message.toString();
                const parsedMessage = JSON.parse(messageString);
                console.log('[WSS Message] Received:', parsedMessage);

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
                console.error('[WSS Message] Failed to parse or handle:', e);
            }
        });

        // --- Close & Error Handling ---
        ws.on('close', () => {
            console.log(`[WSS Close] Client disconnected: ${playerId} from ${gameId}`);
            const index = game.players.findIndex(p => p.id === playerId);
            if (index !== -1) {
                game.players.splice(index, 1);
                delete game.votes[playerId];
                broadcast(gameId, { type: 'PLAYER_LEFT', payload: { playerId } });
            }
        });
        ws.on('error', (error: Error) => {
            console.error(`[WSS Error] Error for ${playerId}:`, error);
            const index = game.players.findIndex(p => p.id === playerId);
             if (index !== -1) {
                game.players.splice(index, 1);
                delete game.votes[playerId];
                broadcast(gameId, { type: 'PLAYER_LEFT', payload: { playerId } });
             }
        });
    });
    return wss;
}

// Initialize or retrieve the singleton WSS instance
export function getWebSocketServer(): WebSocketServer {
    const globalWithWss = globalThis as GlobalWithWss;
    if (!globalWithWss[WEBSOCKET_SERVER_KEY]) {
        globalWithWss[WEBSOCKET_SERVER_KEY] = createWss();
    }
    return globalWithWss[WEBSOCKET_SERVER_KEY]!;
}

// Broadcast function (specific to this module now)
export function broadcast(gameId: string, message: BroadcastMessage, senderWs?: Ws) {
    const game = games.get(gameId);
    if (!game) return;

    const messageString = JSON.stringify(message);
    game.players.forEach((player: Player) => {
        if (player.ws !== senderWs && player.ws.readyState === Ws.OPEN) {
            try {
                player.ws.send(messageString);
            } catch (e) {
                 console.error(`[WSS Broadcast] Failed to send to ${player.id}:`, e);
            }
        }
    });
}

// Function to handle the upgrade (will be called from the hook)
export function handleUpgrade(request: IncomingMessage, socket: Socket, head: Buffer) {
    const wss = getWebSocketServer();
    wss.handleUpgrade(request, socket, head, (ws: Ws) => {
        console.log('[WSS Upgrade] Handshake complete, emitting connection.');
        wss.emit('connection', ws, request);
    });
}

console.log('WebSocket Server Module Initialized.'); 