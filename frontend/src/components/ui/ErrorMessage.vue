<script setup lang="ts">
defineProps<{ message: string }>();
</script>

<template>
  <div class="error-message" role="alert">
    <span class="error-message__icon" aria-hidden="true">⚠</span>
    {{ message }}
  </div>
</template>

<style scoped>
.error-message {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background-color: var(--color-danger-light);
  color: var(--color-danger);
  border: 1px solid rgb(220 38 38 / 0.2);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
}
.error-message__icon { font-size: var(--font-size-base); }
</style>
