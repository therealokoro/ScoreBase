<script lang="ts" setup></script>

<template>
  <UiContainer class="relative h-screen">
    <div class="relative z-20 h-full flex flex-col flex-center py-16 text-center lg:py-24">
      <AppLogo class="size-15" />
      <h3 class="my-4 text-3xl font-semibold md:mb-5 md:text-4xl">
        Welcome to <span class="text-primary underline underline-offset-4">ScoreBase</span>
      </h3>
      <p class="text-muted-foreground max-w-lg">
        The most comprehensive primary and secondary school student result management system. Built
        by Nigerians, for Nigerians
      </p>
      <div class="mt-8 flex w-full flex-col-reverse justify-center gap-3 md:w-auto md:flex-row">
        <UiButton icon-right="lucide:arrow-right" size="lg" to="/login"> Get started </UiButton>
      </div>
    </div>

    <footer class="absolute inset-x-0 bottom-10 text-center">
      <p class="text-sm text-muted-foreground">
        © {{ new Date().getFullYear() }} <span class="text-primary">ScoreBase</span>. All Rights
        Reserved
      </p>
    </footer>

    <!-- Background Pattern -->
    <AppSubtleBg />
  </UiContainer>
</template>
