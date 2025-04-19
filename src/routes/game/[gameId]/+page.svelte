<script lang="ts">
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import type { ClientGameState, ConnectionStatus, VoteValue } from '$lib/types';
	import { PlayerList, StoryArea, VotingArea, ConnectionStatus as ConnectionStatusComponent } from '$lib/components';

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
	let connectionStatus = writable<ConnectionStatus>('connecting');
	let currentVote = writable<VoteValue>(null);
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
</script>

<svelte:head>
	<title>Game: {$gameState.id || 'Loading...'} - PlanPokr</title>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-6 lg:p-8">
	{#if $connectionStatus !== 'connected'}
		<ConnectionStatusComponent status={$connectionStatus} />
	{:else}
		<!-- Main Game Layout -->
		<div class="flex flex-col gap-8">
			<!-- Top Row: Story + Players -->
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Story Area -->
				<StoryArea 
					currentStory={$gameState.currentStory}
					revealed={$gameState.revealed}
					bind:storyInput
					onSetStory={handleSetStory}
					onNextStory={handleNextStory}
				/>
				
				<!-- Player List -->
				<PlayerList
					players={$gameState.players}
					myId={$gameState.myId}
					votes={$gameState.votes}
					revealed={$gameState.revealed}
				/>
			</div>

			<!-- Voting Area -->
			<VotingArea
				revealed={$gameState.revealed}
				votes={$gameState.votes}
				players={$gameState.players}
				currentVote={$currentVote}
				allVoted={$gameState.allVoted}
				onVote={handleVote}
				onReveal={handleReveal}
				onNextStory={handleNextStory}
			/>
		</div>
	{/if}
</div> 