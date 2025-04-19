import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { handleUpgrade } from './src/lib/server/websocket';

// Define the Vite plugin for WebSocket integration
const webSocketPlugin = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		// Check if the server and httpServer exist
		if (!server.httpServer) {
			console.warn('[wssPlugin] httpServer not available, WebSocket integration disabled in this environment.');
			return;
		}

		console.log('[wssPlugin] Configuring WebSocket upgrade listener...');
		const httpServer = server.httpServer;

		// Prevent adding multiple listeners during HMR
		if (httpServer.listenerCount('upgrade') > 0) {
			console.log('[wssPlugin] Upgrade listener seems to be already attached.');
			// Optional: You might want to remove existing listeners first if HMR causes issues
			// httpServer.removeAllListeners('upgrade');
		}

		httpServer.on('upgrade', (req, socket, head) => {
			// Use optional chaining for safety
			const pathname = req.url ? new URL(req.url, `http://${req.headers.host}`).pathname : undefined;

			// Ensure we only handle WebSocket upgrade requests intended for our path
			if (pathname?.startsWith('/ws/game/')) {
				console.log(`[wssPlugin] Handling upgrade for ${pathname}`);
				try {
					// Delegate the upgrade handling to our websocket module
					handleUpgrade(req, socket, head);
				} catch (error) {
					console.error('[wssPlugin] Error during handleUpgrade:', error);
					socket.destroy();
				}
			} else {
				// If the request is not for our WebSocket path, do nothing,
				// allowing other potential upgrade handlers to process it.
				// IMPORTANT: Do NOT destroy the socket here unless you know
				//            nothing else will handle upgrades.
				// console.log(`[wssPlugin] Ignoring upgrade for ${pathname}`);
			}
		});
		console.log('[wssPlugin] WebSocket upgrade listener attached.');
	},
};

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		webSocketPlugin
	]
});
