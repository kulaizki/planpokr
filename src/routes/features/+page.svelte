<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import FeatureCard from '$lib/components/FeatureCard.svelte';

	let show: boolean = false;

	const features = [
		{
			title: 'Real-time Updates',
			description: "See everyone's votes and status changes instantly. No more waiting or refreshing."
		},
		{
			title: 'Quick Start & Share',
			description: 'No login needed! Just create a game and easily share the unique link to start estimating immediately.'
		},
		{
			title: 'Automatic Vote Reveal',
			description: 'Votes stay hidden until everyone on the team has submitted their estimate, then revealed automatically.'
		},
		{
			title: 'Easy Story Management',
			description: "Quickly set the current story you're estimating, and reset for the next one with a single click."
		},
		{
			title: 'Works Everywhere',
			description: 'PlanPokr is fully responsive, providing a seamless experience on desktops, tablets, and phones.'
		},
		{
			title: "See Who's Online",
			description: "Quickly see who has joined the session and whether they've cast their vote yet."
		}
	];

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
		const existingTransform = getComputedStyle(node).transform.replace('none', '');
		return {
			delay: params.delay || 0,
			duration: params.duration || 1000,
			easing: params.easing || cubicOut,
			css: (t: number) => `
        transform: ${existingTransform} translateY(${(1 - t) * 30}px);
        opacity: ${t};
        filter: blur(${(1 - t) * 5}px);
      `
		};
	}

	onMount(() => {
		show = true;
	});
</script>

<svelte:head>
	<title>PlanPokr Features</title>
	<meta
		name="description"
		content="Explore the features of PlanPokr that make agile planning poker fast, simple, and effective for your team."
	/>
</svelte:head>

{#if show}
	<section
		class="container mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20 lg:px-8 lg:py-24"
		transition:blurFly
	>
		<div class="space-y-12">
			<h1
				class="text-center text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl"
			>
				Everything You Need for <span class="text-blue-500">Smooth Estimations</span>
			</h1>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature (feature.title)}
					<FeatureCard title={feature.title} description={feature.description} />
				{/each}
			</div>
		</div>
	</section>
{/if}
