<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { onMount } from 'svelte';

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
	<title>About PlanPokr</title>
	<meta
		name="description"
		content="Learn about PlanPokr, the easy-to-use, real-time planning poker tool designed for agile teams."
	/>
</svelte:head>

{#if show}
<section
	class="container mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-20 lg:px-8 lg:py-24"
	in:blurFly
>
	<div class="space-y-8 text-gray-200">
		<h1 class="text-4xl font-extrabold tracking-tight text-gray-100 sm:text-5xl md:text-6xl">
			Making Agile Planning <span class="text-blue-500">Simple & Fun</span>
		</h1>

		<p class="text-lg text-gray-300 sm:text-xl">
			Estimating work in an agile team can sometimes feel like a chore. Traditional planning poker
			sessions can be slow, require physical cards, or involve clunky online tools. We wanted
			something better.
		</p>

		<h2 class="pt-4 text-3xl font-bold tracking-tight text-gray-100">Meet PlanPokr</h2>

		<p class="text-lg text-gray-300 sm:text-xl">
			PlanPokr is a straightforward, modern tool designed to make planning poker quick,
			collaborative, and hassle-free. Our goal is to get your team estimating accurately without the
			friction.
		</p>

		<p class="text-lg text-gray-300 sm:text-xl">
			There are no accounts to create or software to install. Just start a new game, share the
			unique link with your team, and you're ready to go. It's built for speed and simplicity,
			allowing your team to focus on the discussion, not the tool.
		</p>

		<p class="text-lg text-gray-300 sm:text-xl">
			We believe better planning leads to better products. PlanPokr is our contribution to helping
			agile teams work together more effectively.
		</p>
	</div>
</section>
{/if}
