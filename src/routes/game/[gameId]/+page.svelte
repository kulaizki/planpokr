<script lang="ts">
	import { page } from '$app/stores';
	import { onMount, onDestroy } from 'svelte';
	import { writable, type Writable } from 'svelte/store';
	import { PlayerList, StoryArea, VotingArea, ConnectionStatus } from '$lib/components';
	import { createGameStore } from '$lib/stores/gameStore';
	import { copyGameLink, handleNextStory, handleSetStory, handleVote, initializeGame } from '$lib/services/game.service';
	
	import type { ConnectionStatus as ConnectionStatusType, GameState, VoteValue } from '$lib/types/game';
	
	// Get the game ID from the route parameters
	const gameId = $page.params.gameId;
	
	// State variables
	let nameInput = '';
	let storyInput = '';
	let copyButtonText = 'Copy Invite Link';
	let hasJoined = false;
	
	// Default empty state ensures gameState is always a valid GameState object
	const emptyGameState: GameState = {
		id: null,
		players: [],
		currentStory: '',
		votes: {},
		revealed: false,
		myName: '',
		myId: null,
		allVoted: false
	};
	
	// Initialize reactive stores - start with null, will be populated once the game is joined
	let gameStore: ReturnType<typeof createGameStore> | null = null;
	let currentVote: Writable<VoteValue> = writable(null);
	let status: Writable<ConnectionStatusType> = writable('connecting'); // Initialize with a default store
	let gameStateStore: Writable<GameState> = writable(emptyGameState);
	let unsubscribeFromGame: (() => void) | null = null;
	
	// Reactive variables derived from the stores
	$: gameState = $gameStateStore;
	$: connectionStatus = $status;
	$: playersCount = gameState.players.length;
	$: currentVoteValue = $currentVote;
	$: canReveal = Object.keys(gameState.votes).length > 0;

	// Reset vote selection when a new story starts or votes are revealed
	$: if (gameState.currentStory === '' || gameState.revealed === false) {
		currentVote.set(null);
	}

	// Join the game with the provided name
	function joinGame(): void {
		if (!nameInput.trim()) return;
		
		const gameInstance = initializeGame(gameId, nameInput);
		gameStore = gameInstance.gameStore;
		currentVote = gameInstance.currentVote;
		status = gameInstance.status;
		gameStateStore = gameInstance.gameStateStore;
		unsubscribeFromGame = gameInstance.unsubscribe;
		
		hasJoined = true;
	}

	async function handleCopyLink(): Promise<void> {
		await copyGameLink(setButtonText);
	}

	function setButtonText(text: string): void {
		copyButtonText = text;
	}

	function onVote(vote: string | number): void {
		if (gameStore && currentVote) {
			handleVote(gameStore, currentVote, vote);
		}
	}

	// Handle setting a new story
	function onSetStory(): void {
		if (gameStore) {
			storyInput = handleSetStory(gameStore, storyInput);
		}
	}

	// Handle moving to the next story
	function onNextStory(): void {
		if (gameStore) {
			storyInput = handleNextStory(gameStore);
			// Reset the current vote when moving to a new story
			currentVote.set(null);
		}
	}

	// Clean up subscriptions when the component is destroyed
	onDestroy(() => {
		if (unsubscribeFromGame) {
			unsubscribeFromGame();
		}
	});
</script>

<svelte:head>
	<title>Game: {gameId || 'Loading...'} - PlanPokr</title>
</svelte:head>

<div class="container mx-auto p-4 max-w-4xl">
	{#if !hasJoined}
		<div class="join-card mx-auto max-w-md p-8 bg-gray-800 rounded-lg shadow-md border border-gray-700">
			<h2 class="text-2xl font-bold mb-6 text-center text-white">Join Planning Poker</h2>
			<form on:submit|preventDefault={joinGame} class="flex flex-col gap-4">
				<input 
					bind:value={nameInput} 
					placeholder="Enter your name" 
					class="p-3 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
					required
				/>
				<button type="submit" class="bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 hover:cursor-pointer transition-colors">
					Join Game
				</button>
			</form>
		</div>
	{:else}
		<div class="game-content">
			<div class="mb-4">
				<ConnectionStatus status={connectionStatus} />
			</div>
			
			<div class="flex justify-between items-center mb-6">
				<h1 class="text-2xl font-bold text-white">Planning Poker</h1>
				<div class="flex items-center gap-4">
					<button 
						on:click={handleCopyLink}
						class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 hover:cursor-pointer transition-colors"
					>
						{copyButtonText}
					</button>
					<div class="text-sm text-gray-300">
						{playersCount} player{playersCount !== 1 ? 's' : ''}
					</div>
				</div>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
				<StoryArea 
					currentStory={gameState.currentStory}
					revealed={gameState.revealed}
					bind:storyInput
					onSetStory={onSetStory}
					onNextStory={onNextStory}
				/>
				
				<PlayerList
					players={gameState.players}
					myId={gameState.myId}
					votes={gameState.votes}
					revealed={gameState.revealed}
				/>
			</div>
			
			{#if gameState.currentStory}
				<VotingArea
					revealed={gameState.revealed}
					votes={gameState.votes}
					players={gameState.players}
					currentVote={currentVoteValue}
					allVoted={gameState.allVoted}
					onVote={onVote}
					onNextStory={onNextStory}
				/>
			{/if}
		</div>
	{/if}
</div> 