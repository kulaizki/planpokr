<script lang="ts">
	import Header from '$lib/components/layout/header.svelte';
	import Footer from '$lib/components/layout/footer.svelte';
	import '../app.css'; // Import global styles

	// You might need a load function later for fetching global data
	// export let data;
</script>

<div class="relative flex min-h-dvh flex-col bg-background">
	<Header />
	<main class="flex-1">
		<slot />
	</main>
	<Footer />
</div>
