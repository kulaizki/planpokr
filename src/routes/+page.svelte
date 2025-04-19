<script lang="ts">
	import { goto } from '$app/navigation';
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	const initialLoadComplete = writable(false);

	function createGame() {
		// Generate a simple unique-ish ID
		const gameId = `game_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
		goto(`/game/${gameId}`);
	}

	let show: boolean = false;

	function blurFly(
		node: HTMLElement,
		params: {
			delay?: number;
			duration?: number;
			easing?: (t: number) => number;
		} = {}
	): {
		delay: number;
		duration: number;
		easing: (t: number) => number;
		css: (t: number) => string;
	} {
		return {
			delay: params.delay || 0,
			duration: params.duration || 1000,
			easing: params.easing || cubicOut,
			css: (t: number) => `
        opacity: ${t};
        filter: blur(${(1 - t) * 5}px);
      `
		};
	}

	onMount(() => {
		if (!$initialLoadComplete) {
			initialLoadComplete.set(true);
			show = true; 
		} else {
			show = true; 
		}
	});
</script>

<svelte:head>
	<title>PlanPokr</title>
	<meta
		name="description"
		content="Real-time Planning Poker for agile teams. Simple, fast, and effective sprint estimations."
	/>
</svelte:head>

{#if show}
<section
	class="container mx-auto flex flex-col md:flex-row items-center justify-between gap-10 px-4 py-6 sm:px-6 md:py-10 lg:px-8 lg:py-12"
	in:blurFly
>
		<div class="flex flex-col items-center text-center md:items-start md:text-left gap-4 md:max-w-[50%]">
			<h1
				class="text-4xl leading-tight font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl lg:text-7xl"
			>
				Revolutionize Your <br /> <span class="text-blue-500">Sprint Planning</span>
			</h1>
			<p class="max-w-[700px] text-lg text-gray-300 sm:text-xl">
				PlanPokr provides a simple and intuitive interface for real-time, collaborative estimation
				sessions. Get started in seconds and make planning painless.
			</p>
			<div class="flex flex-col items-center sm:flex-row gap-4 mt-4 w-full justify-center md:justify-start">
				<button
					on:click={createGame}
					class="hover:cursor-pointer inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 px-8 text-base font-semibold whitespace-nowrap text-white ring-offset-gray-900 transition-colors hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					Start New Game
				</button>
				<a
					href="/about"
					class="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-md border border-gray-600 bg-transparent px-8 text-base font-medium whitespace-nowrap text-gray-300 ring-offset-gray-900 transition-colors hover:border-gray-500 hover:bg-gray-800 hover:text-gray-100 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
				>
					Learn More
				</a>
			</div>
		</div>
		<div class="w-full md:w-[45%] flex items-center justify-center">
			<img 
				src="/blue-chips.png" 
				alt="Planning poker blue chips" 
				class="w-24 h-auto md:w-auto md:max-w-full rounded-lg object-cover"
				width="600"
				height="600"
				loading="eager" 
			/>
		</div>
</section>
{/if}
