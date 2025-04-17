<script lang="ts">
	import { page } from '$app/stores';
</script>

<header class="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/95 backdrop-blur">
	<div class="container mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
		<a href="/" class="mr-6 flex items-center space-x-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-6 w-6 text-blue-500"
			>
				<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
			</svg>
			<span class="font-bold text-gray-100 sm:inline-block">PlanPokr</span>
		</a>
		<nav class="flex flex-1 items-center gap-6 text-sm font-medium">
			<a
				href="/about"
				class="transition-colors hover:text-blue-400 {$page.url.pathname === '/about'
					? 'text-blue-400 font-semibold'
					: 'text-gray-400'}"
			>
				About
			</a>
			<a
				href="/features"
				class="transition-colors hover:text-blue-400 {$page.url.pathname === '/features'
					? 'text-blue-400 font-semibold'
					: 'text-gray-400'}"
			>
				Features
			</a>
		</nav>
		<div class="flex items-center space-x-4">
			<button
				class="hover:cursor-pointer inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-blue-600 bg-transparent px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-600 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 disabled:pointer-events-none disabled:opacity-50"
			>
				Sign In
			</button>
		</div>
	</div>
</header> 