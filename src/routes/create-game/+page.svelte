<script lang="ts">
	import { goto } from '$app/navigation';

	function createGame() {
		// Generate a simple unique-ish ID
		const gameId = `game_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
		goto(`/game/${gameId}`);
	}
</script>

<svelte:head>
	<title>Create New Game - PlanPokr</title>
</svelte:head>

<div class="container mx-auto mt-10 max-w-md rounded-lg border border-gray-700 bg-gray-800 p-8 shadow-lg">
	<h1 class="mb-6 text-center text-3xl font-bold text-gray-100">Create a Planning Poker Game</h1>
	<p class="mb-8 text-center text-gray-400">
		Click the button below to generate a unique link for your new game session.
	</p>
	<button
		on:click={createGame}
		class="w-full rounded-md bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 disabled:opacity-50"
	>
		Create Game & Get Link
	</button>
</div> 