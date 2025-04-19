<script lang="ts">
	import { page } from '$app/stores';
	import { onDestroy, onMount } from 'svelte';
	import { writable, get } from 'svelte/store';
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

	let storyInput = '';
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

	onMount(() => {
		const gameId = $page.params.gameId;
		const name = prompt("Enter your name:", `Player_${Math.random().toString(36).substring(2, 6)}`) || 'Anonymous';
		
		// Initialize the game store
		const store = createGameStore(gameId, name);
		gameStore = store;
		
		// Watch connection status and game state
		const statusUnsub = store.connectionStatus.subscribe(value => {
			status.set(value);
		});
		
		const stateUnsub = store.gameState.subscribe(value => {
			gameStateStore.set(value);
		});
		
		return () => {
			statusUnsub();
			stateUnsub();
			store.leaveGame();
		};
	});

	// Reactive statement to reset local vote selection when votes are reset globally
	$: if (!$gameStateStore.revealed) {
		currentVote.set(null);
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
			currentVote.set(null);
		}
	}
</script>

<svelte:head>
	<title>Game: {$page.params.gameId || 'Loading...'} - PlanPokr</title>
</svelte:head>

<div class="container mx-auto min-h-screen p-4 sm:p-6 lg:p-8">
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