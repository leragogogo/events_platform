<script setup lang="ts">
import AppNavbar from "../components/AppNavbar.vue";
</script>

<template>
  <div class="layout">
    <AppNavbar />
    <main class="layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-50);
}

.layout__main {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-6);
}
</style>
