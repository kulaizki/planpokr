<svelte:head>
	<title>PlanPokr - Agile Planning Poker</title>
	<meta
		name="description"
		content="Real-time Planning Poker for agile teams. Simple, fast, and effective sprint estimations."
	/>
</svelte:head>

<section class="container mx-auto grid items-center gap-10 px-4 py-12 sm:px-6 md:py-20 lg:px-8 lg:py-24">
	<div class="flex max-w-[980px] flex-col items-start gap-4">
		<h1
			class="text-4xl font-extrabold leading-tight tracking-tight text-gray-100 sm:text-5xl md:text-6xl lg:text-7xl"
		>
			Revolutionize Your <br/> <span class="text-blue-500">Sprint Planning</span>
		</h1>
		<p class="max-w-[700px] text-lg text-gray-300 sm:text-xl">
			PlanPokr provides a simple and intuitive interface for real-time, collaborative estimation
			sessions. Get started in seconds and make planning painless.
		</p>
	</div>
	<div class="flex flex-col gap-4 sm:flex-row">
		<a
			href="/new-game"
			class="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md bg-blue-600 px-8 text-base font-semibold text-white ring-offset-gray-900 transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
		>
			Start New Game
		</a>
		<a
			href="/learn-more"
			class="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-md border border-gray-600 bg-transparent px-8 text-base font-medium text-gray-300 ring-offset-gray-900 transition-colors hover:border-gray-500 hover:bg-gray-800 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
		>
			Learn More
		</a>
	</div>
</section>

