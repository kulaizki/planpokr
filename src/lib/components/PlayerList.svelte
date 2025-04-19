<script lang="ts">
	import type { PlayerInfo } from '$lib/types';

	export let players: PlayerInfo[] = [];
	export let myId: string | null = null;
	export let votes: { [playerId: string]: string | number | null } = {};
	export let revealed: boolean = false;
</script>

<div class="rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
	<h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Players ({players.length})</h2>
	{#if players.length > 0}
		<ul class="space-y-2">
			{#each players as player (player.id)}
				<li class="flex items-center justify-between rounded bg-gray-700 px-3 py-1.5 text-sm">
					<span class="font-medium text-gray-200 {player.id === myId ? 'text-blue-400 font-semibold' : ''}">
						{player.name}
						{#if player.id === myId}
							<span class="ml-1 text-xs text-blue-500">(You)</span>
						{/if}
					</span>
					{#if revealed}
						<span class="rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{votes[player.id] ?? '-'}</span>
					{:else}
						<span class="h-5 w-5 rounded-full {player.voted ? 'bg-green-500' : 'bg-gray-500'}" title={player.voted ? 'Voted' : 'Waiting...'}></span>
					{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-sm text-gray-400 italic">No players yet...</p>
	{/if}
</div> 