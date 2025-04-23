<script lang="ts">
	import type { PlayerInfo, VoteValue } from '$lib/types/game';
	
	export let revealed: boolean = false;
	export let votes: { [playerId: string]: string | number | null } = {};
	export let players: PlayerInfo[] = [];
	export let currentVote: VoteValue = null;
	export let allVoted: boolean = false;
	export let onVote: (vote: string | number) => void;
	export let onNextStory: () => void;
	
	const cardDeck = [0, 1, 2, 3, 5, 8, 13, 21, 34];

	// Reactive calculation for average vote
	$: averageVote = (() => {
		if (!revealed || Object.keys(votes).length === 0) {
			return null;
		}
		
		const numericVotes = Object.values(votes)
			.map(vote => typeof vote === 'number' ? vote : parseFloat(String(vote)))
			.filter(vote => !isNaN(vote));
			
		if (numericVotes.length === 0) {
			return 'N/A'; 
		}
		
		const sum = numericVotes.reduce((acc, vote) => acc + vote, 0);
		return (sum / numericVotes.length).toFixed(1); 
	})();
</script>

<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center shadow">
	{#if revealed}
		<h2 class="mb-4 text-lg font-semibold text-gray-200">Votes Revealed!</h2>
		
		<!-- Vote Results -->
		<div class="mb-6 flex flex-wrap justify-center gap-4">
			{#each Object.entries(votes) as [playerId, vote] (playerId)}
				{@const player = players.find(p => p.id === playerId)}
				<div class="flex flex-col items-center">
					<div class="mb-1 flex h-20 w-14 items-center justify-center rounded-md border-2 border-blue-500 bg-gray-700 text-2xl font-bold text-white shadow-md">
						{vote ?? '-'}
					</div>
					<span class="text-xs text-gray-400">{player?.name ?? 'Unknown'}</span>
				</div>
			{/each}
		</div>
		
		{#if averageVote !== null}
			<div class="mt-6 rounded-lg bg-gray-700 p-4 inline-block">
				<span class="text-sm font-medium uppercase tracking-wider text-gray-400">Average Estimate</span>
				<p class="text-3xl font-bold text-blue-500">{averageVote}</p>
			</div>
		{/if}
		
		<div class="mt-8">
			<button on:click={onNextStory} class="rounded bg-purple-600 px-8 py-2.5 font-semibold text-white hover:bg-purple-700 hover:cursor-pointer transition-colors">
				Start Next Story / Reset Votes
			</button>
		</div>
	{:else}
		<h2 class="mb-6 text-lg font-semibold text-gray-200">Choose your estimate:</h2>
		<div class="flex flex-wrap justify-center gap-3 sm:gap-4">
			{#each cardDeck as cardValue (cardValue)}
				{@const isSelected = currentVote === cardValue}
				<button
					on:click={() => onVote(cardValue)}
					class="flex h-24 w-16 transform flex-col items-center justify-center rounded-lg border-2 shadow-md transition-all duration-150 ease-in-out sm:h-28 sm:w-20 hover:cursor-pointer {isSelected
						? 'border-blue-500 bg-blue-600 scale-105'
						: 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'}"
					disabled={revealed}
				>
					<span class="text-2xl font-bold text-white sm:text-3xl">{cardValue}</span>
				</button>
			{/each}
		</div>
		{#if !allVoted}
			<p class="mt-8 text-sm text-gray-400">Waiting for all players to vote...</p>
		{/if}
	{/if}
</div> 