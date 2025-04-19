<script lang="ts">
	import type { ConnectionStatus } from '$lib/types';
	
	export let status: ConnectionStatus;
</script>

{#if status === 'connecting'}
	<p class="text-center text-yellow-400">Connecting to game...</p>
{:else if status === 'disconnected'}
	<p class="text-center text-red-500">Disconnected. Please refresh to rejoin.</p>
{:else if status === 'error'}
	<p class="text-center text-red-600">Connection error. Could not join game.</p>
{/if} 