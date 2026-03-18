<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="empty-state">
    <div v-if="$slots.icon" class="empty-state__icon">
      <slot name="icon" />
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state__action">
      <slot name="action" />
    </div>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-12) var(--space-8);
  text-align: center;
  color: var(--color-neutral-500);
}
.empty-state__icon { font-size: 2.5rem; }
.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-700);
}
.empty-state__description { font-size: var(--font-size-sm); max-width: 360px; }
.empty-state__action { margin-top: var(--space-2); }
</style>
