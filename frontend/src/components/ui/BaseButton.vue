<script setup lang="ts">
import BaseSpinner from "./BaseSpinner.vue";

withDefaults(defineProps<{
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}>(), {
  variant: "primary",
  size: "md",
  loading: false,
  disabled: false,
  type: "button",
});
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="['btn', `btn--${variant}`, `btn--${size}`, { 'btn--loading': loading }]"
  >
    <BaseSpinner v-if="loading" size="sm" class="btn__spinner" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* Sizes */
.btn--sm  { padding: var(--space-1) var(--space-3); font-size: var(--font-size-sm); }
.btn--md  { padding: var(--space-2) var(--space-4); font-size: var(--font-size-sm); }
.btn--lg  { padding: var(--space-3) var(--space-6); font-size: var(--font-size-base); }

/* Variants */
.btn--primary {
  background-color: var(--color-primary);
  color: #fff;
}
.btn--primary:hover:not(:disabled) { background-color: var(--color-primary-hover); }

.btn--secondary {
  background-color: #fff;
  color: var(--color-neutral-700);
  border-color: var(--color-neutral-300);
}
.btn--secondary:hover:not(:disabled) { background-color: var(--color-neutral-50); }

.btn--danger {
  background-color: var(--color-danger);
  color: #fff;
}
.btn--danger:hover:not(:disabled) { background-color: var(--color-danger-hover); }

.btn--ghost {
  background-color: transparent;
  color: var(--color-neutral-600);
}
.btn--ghost:hover:not(:disabled) { background-color: var(--color-neutral-100); }

.btn__spinner { flex-shrink: 0; }
</style>
