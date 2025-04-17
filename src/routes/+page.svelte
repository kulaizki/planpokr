<script lang="ts">
	// Import necessary components later, e.g., Button for starting a game
	// import Button from '$lib/components/ui/button/button.svelte';
</script>

<svelte:head>
	<title>PlanPokr - Agile Planning Poker</title>
	<meta
		name="description"
		content="Real-time Planning Poker for agile teams. Simple, fast, and effective sprint estimations."
	/>
</svelte:head>

<section class="container grid items-center gap-6 pb-8 pt-6 md:py-10">
	<div class="flex max-w-[980px] flex-col items-start gap-2">
		<h1 class="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
			Streamline Your Sprint Planning
		</h1>
		<p class="max-w-[700px] text-lg text-muted-foreground">
			PlanPokr provides a simple and intuitive interface for real-time, collaborative estimation
			sessions. Get started in seconds.
		</p>
	</div>
	<div class="flex gap-4">
		<a
			href="/new-game" 
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
		>
			Start New Game
		</a>
		<a
			href="#" 
			class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
		>
			Learn More
		</a>
	</div>
</section>

<section class="container mt-12">
	<h2 class="mb-6 text-2xl font-semibold tracking-tight">
		Features
	</h2>
	<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
		<!-- Feature Cards Placeholder -->
		<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
			<h3 class="mb-2 text-lg font-semibold">Real-time Collaboration</h3>
			<p class="text-sm text-muted-foreground">Vote and see results instantly with your team.</p>
		</div>
		<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
			<h3 class="mb-2 text-lg font-semibold">Customizable Card Decks</h3>
			<p class="text-sm text-muted-foreground">Use Fibonacci, T-Shirt sizes, or create your own.</p>
		</div>
		<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
			<h3 class="mb-2 text-lg font-semibold">Modern Interface</h3>
			<p class="text-sm text-muted-foreground">Clean, intuitive design with light and dark modes.</p>
		</div>
	</div>
</section>
