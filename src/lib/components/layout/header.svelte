<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
  import { Sun, Moon } from 'lucide-svelte'; // Placeholder icons

  // Basic theme toggle logic
  function toggleTheme() {
    theme.toggle();
  }
</script>

<header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="container flex h-14 max-w-screen-2xl items-center">
    <div class="mr-4 hidden md:flex">
      <a href="/" class="mr-6 flex items-center space-x-2">
        <!-- Placeholder Logo -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        <span class="hidden font-bold sm:inline-block">PlanPokr</span>
      </a>
      <nav class="flex items-center gap-6 text-sm">
        <!-- Add Navigation Links Here -->
        <a href="/about" class="transition-colors hover:text-foreground/80 text-foreground/60">About</a>
        <a href="/features" class="transition-colors hover:text-foreground/80 text-foreground/60">Features</a>
      </nav>
    </div>
    <div class="flex flex-1 items-center justify-end space-x-2">
      <button on:click={toggleTheme} class="flex items-center justify-center rounded-full p-2 transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        {#if theme.value === 'dark' || (theme.value === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) }
          <Sun class="h-5 w-5" />
        {:else}
          <Moon class="h-5 w-5" />
        {/if}
        <span class="sr-only">Toggle theme</span>
      </button>
      <!-- Add Auth Button/User Info Here -->
    </div>
  </div>
</header> 