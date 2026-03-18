<script setup lang="ts">
defineProps<{
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  size?: "sm" | "md";
}>();
</script>

<template>
  <span :class="['badge', `badge--${variant ?? 'default'}`, `badge--${size ?? 'md'}`]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  font-weight: 500;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.badge--sm {
  font-size: var(--font-size-xs);
  padding: 2px var(--space-2);
}
.badge--md {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-3);
}

.badge--default {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-700);
}
.badge--primary {
  background-color: rgb(79 70 229 / 0.1);
  color: var(--color-primary);
}
.badge--success {
  background-color: rgb(22 163 74 / 0.1);
  color: var(--color-success);
}
.badge--warning {
  background-color: rgb(234 179 8 / 0.1);
  color: #a16207;
}
.badge--danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}
</style>
