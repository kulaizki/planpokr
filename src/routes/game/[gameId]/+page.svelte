<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { PlayerList, StoryArea, VotingArea, ConnectionStatus } from '$lib/components';
	import { createGameStore } from '$lib/stores/gameStore';
	
	// Define types locally
	type ConnectionStatusType = 'connecting' | 'connected' | 'disconnected' | 'error';
	type VoteValue = string | number | null;
	
	interface PlayerInfo {
		id: string;
		name: string;
		voted: boolean;
	}
	
	interface GameState {
		id: string | null;
		players: PlayerInfo[];
		currentStory: string;
		votes: { [playerId: string]: string | number | null };
		revealed: boolean;
		myName: string;
		myId: string | null; 
		allVoted: boolean;
	}

	let gameId: string = $page.params.gameId;
	let nameInput = ''; // Input for the modal
	let awaitingNameInput = true; // Control modal display
	let storyInput = ''; // Input for setting the story
	let gameStore: ReturnType<typeof createGameStore> | null = null;
	let currentVote = writable<VoteValue>(null);
	let status = writable<ConnectionStatusType>('connecting');
	let gameStateStore = writable<GameState>({
		id: null,
		players: [],
		currentStory: '',
		votes: {},
		revealed: false,
		myName: '',
		myId: null,
		allVoted: false
	});
	let statusUnsub: () => void;
	let stateUnsub: () => void;
	let copyButtonText = 'Copy Invite Link';

	function initializeGame() {
		if (!nameInput.trim()) {
			nameInput = 'Anonymous'; // Default name if empty
		}
		awaitingNameInput = false; // Hide modal
		
		// Initialize the game store
		const store = createGameStore(gameId, nameInput);
		gameStore = store;
		
		// Watch connection status and game state
		statusUnsub = store.connectionStatus.subscribe(value => {
			status.set(value);
		});
		
		stateUnsub = store.gameState.subscribe(value => {
			gameStateStore.set(value);
		});
	}

	onMount(() => {
		// Game initialization is now triggered by the name input form
		return () => {
			if (statusUnsub) statusUnsub();
			if (stateUnsub) stateUnsub();
			if (gameStore) gameStore.leaveGame();
		};
	});

	let previousRevealed = false; // Track previous revealed state
	// Reactive statement to reset local vote selection ONLY when votes are reset globally
	$: {
		if (previousRevealed && !$gameStateStore.revealed) {
			currentVote.set(null);
		}
		previousRevealed = $gameStateStore.revealed;
	}

	function handleVote(vote: string | number) {
		if (gameStore) {
			currentVote.set(vote);
			gameStore.vote(vote);
		}
	}

	function handleSetStory() {
		if (gameStore && storyInput.trim()) {
			gameStore.setStory(storyInput.trim());
			storyInput = '';
		}
	}

	function handleNextStory() {
		if (gameStore) {
			gameStore.setStory(''); 
			storyInput = '';
			// No need to set currentVote here anymore, the reactive statement handles it
		}
	}

	function copyLink() {
		navigator.clipboard.writeText(window.location.href)
			.then(() => {
				copyButtonText = 'Copied!';
				setTimeout(() => { copyButtonText = 'Copy Invite Link'; }, 2000);
			})
			.catch((err: unknown) => {
				console.error('Failed to copy link:', err);
				copyButtonText = 'Failed to copy';
				setTimeout(() => { copyButtonText = 'Copy Invite Link'; }, 2000);
			});
	}
</script>

<svelte:head>
	<title>Game: {gameId || 'Loading...'} - PlanPokr</title>
</svelte:head>

{#if awaitingNameInput}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-xl bg-gray-800 p-8 shadow-2xl border border-gray-700">
			<h2 class="mb-6 text-2xl font-bold text-white text-center">Join Planning Poker</h2>
			<form on:submit|preventDefault={initializeGame} class="flex flex-col gap-4">
				<div>
					<label for="name-input" class="mb-2 block text-sm font-medium text-gray-300">Your Name</label>
					<input
						id="name-input"
						type="text"
						bind:value={nameInput}
						placeholder="Enter your name..."
						class="w-full rounded-lg border border-gray-600 bg-gray-700 px-4 py-3 text-lg text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
						autofocus
					/>
				</div>
				<p class="text-sm text-gray-400 italic">This will be visible to other players in the game.</p>
				<button 
					type="submit"
					class="mt-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors hover:cursor-pointer"
				>
					Join Game
				</button>
			</form>
		</div>
	</div>
{:else}
	<div class="container mx-auto min-h-screen p-4 sm:p-6 lg:p-8">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold text-gray-100">PlanPokr Game</h1>
			<button 
				on:click={copyLink}
				class="rounded bg-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-500 transition-colors hover:cursor-pointer"
			>
				{copyButtonText}
			</button>
		</div>

		{#if $status !== 'connected'}
			<ConnectionStatus status={$status} />
		{:else}
			<!-- Main Game Layout -->
			<div class="flex flex-col gap-8">
				<!-- Top Row: Story + Players -->
				<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
					<!-- Story Area -->
					<StoryArea 
						currentStory={$gameStateStore.currentStory}
						revealed={$gameStateStore.revealed}
						bind:storyInput
						onSetStory={handleSetStory}
						onNextStory={handleNextStory}
					/>
					
					<!-- Player List -->
					<PlayerList
						players={$gameStateStore.players}
						myId={$gameStateStore.myId}
						votes={$gameStateStore.votes}
						revealed={$gameStateStore.revealed}
					/>
				</div>

				<!-- Voting Area -->
				<VotingArea
					revealed={$gameStateStore.revealed}
					votes={$gameStateStore.votes}
					players={$gameStateStore.players}
					currentVote={$currentVote}
					allVoted={$gameStateStore.allVoted}
					onVote={handleVote}
					onNextStory={handleNextStory}
				/>
			</div>
		{/if}
	</div>
{/if} 