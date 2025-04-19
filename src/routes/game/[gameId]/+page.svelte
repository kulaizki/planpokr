<script lang="ts">
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';

	// --- Game State (Client-side Mirror) ---
	interface PlayerInfo {
		id: string;
		name: string;
		voted: boolean; // Track if player has voted in current round
	}
	interface ClientGameState {
		id: string | null;
		players: PlayerInfo[];
		currentStory: string;
		votes: { [playerId: string]: string | number | null };
		revealed: boolean;
		myName: string;
		myId: string | null; // Store our own player ID
		allVoted: boolean;
	}

	const gameState = writable<ClientGameState>({
		id: null,
		players: [],
		currentStory: 'No story set yet.',
		votes: {},
		revealed: false,
		myName: 'Anon',
		myId: null,
		allVoted: false,
	});

	let ws: WebSocket | null = null;
	let connectionStatus = writable<'connecting' | 'connected' | 'disconnected' | 'error' >('connecting');
	let currentVote = writable<string | number | null>(null);
	let storyInput = '';

	// --- WebSocket Logic ---
	onMount(() => {
		const gameId = $page.params.gameId;
		const name = prompt("Enter your name:", `Player_${Math.random().toString(36).substring(2, 6)}`) || 'Anonymous';
		gameState.update(s => ({ ...s, myName: name, id: gameId }));

		// Construct WebSocket URL
		const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		const wsUrl = `${wsProtocol}//${window.location.host}/ws/game/${gameId}?name=${encodeURIComponent(name)}`;

		console.log('Connecting to:', wsUrl);
		connectionStatus.set('connecting');

		try {
			ws = new WebSocket(wsUrl);

			ws.onopen = () => {
				console.log('WebSocket connected');
				connectionStatus.set('connected');
			};

			ws.onmessage = (event) => {
				try {
					const message = JSON.parse(event.data);
					console.log('WS Received:', message);

					switch (message.type) {
						case 'GAME_STATE':
							gameState.update(s => ({
								...s,
								players: message.payload.players.map((p: any) => ({ ...p, voted: message.payload.votes[p.id] !== null })),
								currentStory: message.payload.currentStory,
								votes: message.payload.revealed ? message.payload.votes : {},
								revealed: message.payload.revealed,
								myId: message.payload.players.find((p: any) => p.name === name)?.id || null, // Simplified ID finding
								allVoted: Object.values(message.payload.votes).every(v => v !== null)
							}));
							break;
						case 'PLAYER_JOINED':
							gameState.update(s => ({
								...s,
								players: [...s.players, { ...message.payload, voted: false }]
							}));
							break;
						case 'PLAYER_LEFT':
							gameState.update(s => ({
								...s,
								players: s.players.filter(p => p.id !== message.payload.playerId)
							}));
							break;
						case 'PLAYER_VOTED':
                            gameState.update(s => ({ 
                                ...s, 
                                players: s.players.map(p => 
                                    p.id === message.payload.playerId ? { ...p, voted: true } : p
                                )
                            }));
                            break;
                         case 'ALL_VOTED':
                            gameState.update(s => ({ ...s, allVoted: true }));
                            break;
						case 'REVEAL_VOTES':
							gameState.update(s => ({
								...s,
								revealed: true,
								votes: message.payload,
								allVoted: true // Votes are revealed, so all must have voted or process stopped
							}));
							break;
						case 'NEW_STORY':
                         case 'STORY_SET': // Handle similarly on client
							currentVote.set(null); // Reset local vote selection
							gameState.update(s => ({
								...s,
								currentStory: message.payload.story,
								revealed: false,
								votes: message.payload.votes,
								players: s.players.map(p => ({ ...p, voted: false })),
								allVoted: false
							}));
							break;
					}
				} catch (e) {
					console.error('Error processing message:', e);
				}
			};

			ws.onclose = (event) => {
				console.log('WebSocket closed:', event.code, event.reason);
				connectionStatus.set('disconnected');
				ws = null;
				// Optional: Attempt reconnection?
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				connectionStatus.set('error');
				ws = null;
			};
		} catch (err) {
			console.error('Failed to create WebSocket:', err);
			connectionStatus.set('error');
		}

		return () => {
			if (ws) {
				console.log('Closing WebSocket connection on component destroy');
				ws.close();
			}
		};
	});

	// --- Helper Functions ---
	function sendMessage(type: string, payload: any = {}) {
		if (ws && ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ type, payload }));
		} else {
			console.warn('WebSocket not open, cannot send message:', type, payload);
		}
	}

	function handleVote(vote: string | number) {
		if (!$gameState.revealed) {
			currentVote.set(vote);
			sendMessage('VOTE', { vote });
		}
	}

	function handleReveal() {
		sendMessage('REVEAL');
	}

    function handleSetStory() {
        if (storyInput.trim()) {
             sendMessage('SET_STORY', { story: storyInput.trim() });
        }
    }

	function handleNextStory() {
		storyInput = ''; // Clear input for potential next story
		sendMessage('NEXT_STORY', { story: '' }); // Clear story on server, reset votes
	}

	// Default Fibonacci deck
	const cardDeck = [0, 1, 2, 3, 5, 8, 13, 21, 34, '∞', '?']; // Added '∞' and '?' common options

	// --- UI Components (Inline for simplicity, extract later) ---
	// Player List Component Placeholder
	// Story Display Component Placeholder
	// Card Deck / Voting Component Placeholder
	// Results Display Component Placeholder

</script>

<svelte:head>
	<title>Game: {$gameState.id || 'Loading...'} - PlanPokr</title>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-6 lg:p-8">
	{#if $connectionStatus === 'connecting'}
		<p class="text-center text-yellow-400">Connecting to game...</p>
	{:else if $connectionStatus === 'disconnected'}
		<p class="text-center text-red-500">Disconnected. Please refresh to rejoin.</p>
	{:else if $connectionStatus === 'error'}
		<p class="text-center text-red-600">Connection error. Could not join game.</p>
	{:else if $connectionStatus === 'connected'}
		<!-- Main Game Layout -->
		<div class="flex flex-col gap-8">
			<!-- Top Row: Story + Players -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Story Area -->
				<div class="md:col-span-2 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
					<h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">Current Story</h2>
                     {#if $gameState.revealed}
                         <!-- Show results/next story button after reveal -->
                         <p class="mb-4 min-h-[60px] text-xl font-medium text-gray-100">{$gameState.currentStory || 'Waiting for next story...'}</p>
                         <button on:click={handleNextStory} class="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
                             Start Next Story / Reset Votes
                         </button>
                     {:else}
                        <!-- Allow setting story before reveal -->
                        <p class="mb-2 min-h-[60px] text-xl font-medium text-gray-100">{$gameState.currentStory || 'No story set yet.'}</p>
                        <div class="flex gap-2">
                            <input
                                type="text"
                                bind:value={storyInput}
                                placeholder="Enter story title or description..."
                                class="flex-grow rounded border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button on:click={handleSetStory} class="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                                Set Story
                            </button>
                        </div>
                     {/if}
				</div>
				<!-- Player List -->
				<div class="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
					<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Players ({$gameState.players.length})</h2>
					<ul class="space-y-2">
						{#each $gameState.players as player (player.id)}
							<li class="flex items-center justify-between rounded bg-gray-700 px-3 py-1.5 text-sm">
								<span class="font-medium text-gray-200 {player.id === $gameState.myId ? 'text-blue-400' : ''}">{player.name} {player.id === $gameState.myId ? '(You)' : ''}</span>
								{#if $gameState.revealed}
									<span class="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{$gameState.votes[player.id] ?? '-'}</span>
								{:else}
									<span class="h-5 w-5 rounded-full {player.voted ? 'bg-green-500' : 'bg-gray-500'}" title={player.voted ? 'Voted' : 'Waiting...'}></span>
								{/if}
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Voting Area -->
			<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center shadow">
                 {#if $gameState.revealed}
                    <h2 class="mb-4 text-lg font-semibold text-gray-200">Votes Revealed!</h2>
                     <!-- Basic Result Display -->
                     <div class="flex flex-wrap justify-center gap-4">
                         {#each Object.entries($gameState.votes) as [playerId, vote] (playerId)}
                            {@const player = $gameState.players.find(p => p.id === playerId)}
                            <div class="flex flex-col items-center">
                                <div class="mb-1 flex h-20 w-14 items-center justify-center rounded-md border-2 border-blue-500 bg-gray-700 text-2xl font-bold text-white shadow-md">
                                    {vote ?? '-'}
                                </div>
                                <span class="text-xs text-gray-400">{player?.name ?? 'Unknown'}</span>
                            </div>
                         {/each}
                     </div>
                     <button on:click={handleNextStory} class="mt-6 rounded bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700">
                        Start Next Story / Reset Votes
                    </button>
                 {:else}
                    <h2 class="mb-6 text-lg font-semibold text-gray-200">Choose your estimate:</h2>
                    <div class="flex flex-wrap justify-center gap-3 sm:gap-4">
                        {#each cardDeck as cardValue (cardValue)}
                            {@const isSelected = $currentVote === cardValue}
                            <button
                                on:click={() => handleVote(cardValue)}
                                class="flex h-24 w-16 transform flex-col items-center justify-center rounded-lg border-2 shadow-md transition-all duration-150 ease-in-out sm:h-28 sm:w-20 {isSelected
                                    ? 'border-blue-500 bg-blue-600 scale-105'
                                    : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'}"
                                disabled={$gameState.revealed}
                            >
                                <span class="text-2xl font-bold text-white sm:text-3xl">{cardValue}</span>
                            </button>
                        {/each}
                    </div>
                     {#if $gameState.allVoted}
                        <button on:click={handleReveal} class="mt-8 rounded bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700">
                             Reveal Votes
                        </button>
                     {:else}
                        <p class="mt-8 text-sm text-gray-400">Waiting for all players to vote...</p>
                    {/if}
                 {/if}
			</div>
		</div>
	{/if}
</div> 