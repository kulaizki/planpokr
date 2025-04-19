import type { Handle } from '@sveltejs/kit';
import { WebSocketServer } from 'ws';
import { type GameState, games } from '$lib/server/game_state'; // We will create this next

console.log('Setting up WebSocket server...');

const wss = new WebSocketServer({ noServer: true }); // Use noServer to integrate with existing HTTP server

wss.on('connection', (ws, request) => {
    // Extract gameId from the request URL (e.g., /ws/game/[gameId])
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const gameIdMatch = url.pathname.match(/^\/ws\/game\/([a-zA-Z0-9-]+)$/);
    const gameId = gameIdMatch ? gameIdMatch[1] : null;

    if (!gameId) {
        console.log('WS connection without valid gameId, closing.');
        ws.close();
        return;
    }

    console.log(`Client connected to game: ${gameId}`);

    // Initialize game if it doesn't exist (basic handling)
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

    // Add player (simplified ID for now)
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const playerName = url.searchParams.get('name') || `Anon_${playerId.slice(-4)}`;
    game.players.push({ id: playerId, name: playerName, ws });
    game.votes[playerId] = null; // Initialize vote

    // Send initial game state to the new player
    ws.send(JSON.stringify({ type: 'GAME_STATE', payload: { ...game, players: game.players.map(p => ({ id: p.id, name: p.name })) } })); // Don't send ws objects

    // Notify others about the new player
    broadcast(gameId, { type: 'PLAYER_JOINED', payload: { id: playerId, name: playerName } }, ws);


    ws.on('message', (message) => {
        try {
            const parsedMessage = JSON.parse(message.toString());
            console.log('Received:', parsedMessage);

            switch (parsedMessage.type) {
                case 'VOTE':
                    if (game.players.some(p => p.id === playerId)) {
                        game.votes[playerId] = parsedMessage.payload.vote;
                        // Notify others that player has voted (but not the value yet)
                        broadcast(gameId, { type: 'PLAYER_VOTED', payload: { playerId } });
                         // Check if all players voted
                         if (Object.values(game.votes).every(vote => vote !== null)) {
                            broadcast(gameId, { type: 'ALL_VOTED' });
                        }
                    }
                    break;
                case 'REVEAL':
                    game.revealed = true;
                    broadcast(gameId, { type: 'REVEAL_VOTES', payload: game.votes });
                    break;
                case 'NEXT_STORY':
                    game.currentStory = parsedMessage.payload.story || ''; // Allow updating story
                    game.revealed = false;
                    // Reset votes
                    Object.keys(game.votes).forEach(pid => game.votes[pid] = null);
                    broadcast(gameId, { type: 'NEW_STORY', payload: { story: game.currentStory, votes: game.votes } });
                    break;
                 case 'SET_STORY':
                    game.currentStory = parsedMessage.payload.story || '';
                     // Reset votes when story changes
                    game.revealed = false;
                    Object.keys(game.votes).forEach(pid => game.votes[pid] = null);
                    broadcast(gameId, { type: 'STORY_SET', payload: { story: game.currentStory, votes: game.votes } });
                    break;

            }
        } catch (e) {
            console.error('Failed to parse message or handle', e);
        }
    });

    ws.on('close', () => {
        console.log(`Client disconnected from game: ${gameId}`);
        // Remove player
        const index = game.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            game.players.splice(index, 1);
            delete game.votes[playerId];
             // Remove game if empty? Maybe later.
            // Notify others
            broadcast(gameId, { type: 'PLAYER_LEFT', payload: { playerId } });
        }
    });

    ws.on('error', (error) => {
        console.error(`WebSocket error for ${playerId}:`, error);
    });
});


// Broadcast helper function
export function broadcast(gameId: string, message: any, senderWs?: WebSocket) {
    const game = games.get(gameId);
    if (!game) return;

    const messageString = JSON.stringify(message);
    game.players.forEach(player => {
        if (player.ws !== senderWs && player.ws.readyState === WebSocket.OPEN) {
            try {
                player.ws.send(messageString);
            } catch (e) {
                 console.error(`Failed to send message to player ${player.id}:`, e);
            }
        }
    });
}

// SvelteKit handle hook to upgrade connections
export const handle: Handle = async ({ event, resolve }) => {
    const { server } = event.platform?.viteDevServer || globalThis // Access Vite's server in dev, needs adapter support in prod
     || { server: null };

     if (server && server.httpServer) {
        server.httpServer.on('upgrade', (request, socket, head) => {
             // Only handle upgrades for our specific path
             const url = new URL(request.url || '', `http://${request.headers.host}`);
            if (url.pathname.startsWith('/ws/game/')) {
                wss.handleUpgrade(request, socket, head, (ws) => {
                    wss.emit('connection', ws, request);
                });
             } else {
                 // For other paths, make sure to destroy the socket if not handled
                 socket.destroy();
             }
        });
     } else {
         console.warn('HTTP server not available, WebSocket upgrade might not work in production without adapter support.');
     }

    return resolve(event);
};

console.log('WebSocket server setup complete.'); 