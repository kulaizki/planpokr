<script lang="ts">
	export let currentStory: string = '';
	export let revealed: boolean = false;
	export let storyInput: string = '';
	export let onSetStory: () => void;
	export let onNextStory: () => void;
</script>

<div class="md:col-span-2 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow">
	<h2 class="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-400">Current Story</h2>
	{#if revealed}
		<!-- Show results/next story button after reveal -->
		<p class="mb-4 min-h-[60px] text-xl font-medium text-gray-100">{currentStory || 'Waiting for next story...'}</p>
		<button on:click={onNextStory} class="w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
			Start Next Story / Reset Votes
		</button>
	{:else}
		<!-- Allow setting story before reveal -->
		<p class="mb-2 min-h-[60px] text-xl font-medium text-gray-100">{currentStory || 'No story set yet.'}</p>
		<div class="flex gap-2">
			<input
				type="text"
				bind:value={storyInput}
				placeholder="Enter story title or description..."
				class="flex-grow rounded border border-gray-600 bg-gray-700 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
			/>
			<button on:click={onSetStory} class="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
				Set Story
			</button>
		</div>
	{/if}
</div> 