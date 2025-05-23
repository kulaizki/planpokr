<script lang="ts">
	import Header from '$lib/components/layout/header.svelte';
	import Footer from '$lib/components/layout/footer.svelte';
	import '../app.css'; 

</script>

<div class="relative flex min-h-dvh flex-col bg-background">
	<Header />
	<main class="flex-1 flex flex-col">
		<slot />
	</main>
	<Footer />
</div>
