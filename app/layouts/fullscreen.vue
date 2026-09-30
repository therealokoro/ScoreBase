<script lang="ts" setup>
/**
 * Blank-canvas layout: no sidebar, no breadcrumbs, no Page chrome. Pages render their own
 * (print:hidden) top bar inside the slot, so printing shows only the document itself. min-h-screen
 * (not h-screen) keeps print output unclipped — the shell grows with the A4 document instead of
 * trapping it in a fixed-height scroll container.
 */
</script>

<template>
  <div class="bg-background flex min-h-screen flex-col">
    <slot />
  </div>
</template>
