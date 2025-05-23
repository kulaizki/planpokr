<script lang="ts">
  export let title: string;
  export let description: string;
</script>

<div
  class="group select-none rounded-lg bg-slate-800 p-6 shadow-xl border border-border/60 border-l-4 border-blue-500 transition-all duration-300 ease-in-out hover:scale-105 hover:-translate-y-1 hover:shadow-2xl hover:bg-primary/10 hover:border-primary"
>
  <h3
    class="text-blue-100 mb-3 text-xl font-semibold text-foreground transition-colors duration-300 group-hover:text-primary"
  >
    {title}
  </h3>
  <p class="text-muted-foreground">
    {description}
  </p>
</div> 