<script lang="ts">
	import type { PlayerInfo, VoteValue } from '$lib/types';
	
	export let revealed: boolean = false;
	export let votes: { [playerId: string]: string | number | null } = {};
	export let players: PlayerInfo[] = [];
	export let currentVote: VoteValue = null;
	export let allVoted: boolean = false;
	export let onVote: (vote: string | number) => void;
	export let onNextStory: () => void;
	
	// Default Fibonacci deck
	const cardDeck = [0, 1, 2, 3, 5, 8, 13, 21, 34, '∞', '?'];
</script>

<div class="rounded-lg border border-gray-700 bg-gray-800 p-6 text-center shadow">
	{#if revealed}
		<h2 class="mb-4 text-lg font-semibold text-gray-200">Votes Revealed!</h2>
		<!-- Basic Result Display -->
		<div class="flex flex-wrap justify-center gap-4">
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
		<button on:click={onNextStory} class="mt-6 rounded bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700">
			Start Next Story / Reset Votes
		</button>
	{:else}
		<h2 class="mb-6 text-lg font-semibold text-gray-200">Choose your estimate:</h2>
		<div class="flex flex-wrap justify-center gap-3 sm:gap-4">
			{#each cardDeck as cardValue (cardValue)}
				{@const isSelected = currentVote === cardValue}
				<button
					on:click={() => onVote(cardValue)}
					class="flex h-24 w-16 transform flex-col items-center justify-center rounded-lg border-2 shadow-md transition-all duration-150 ease-in-out sm:h-28 sm:w-20 {isSelected
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