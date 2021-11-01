<script lang="ts">
  export let name: string;
</script>

<main>
  From Box
  <slot />
  <input type="text" bind:value={name} />
  {name}
</main>

<style>
  input {
    color: green;
  }
</style>
