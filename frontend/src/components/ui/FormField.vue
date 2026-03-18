<script setup lang="ts">
defineProps<{
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
}>();

const id = `field-${Math.random().toString(36).slice(2, 8)}`;
</script>

<template>
  <div class="field">
    <label :for="id" class="field__label">
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </label>
    <p v-if="hint" class="field__hint">{{ hint }}</p>
    <slot :id="id" :error="error" />
    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.field { display: flex; flex-direction: column; gap: var(--space-1); }

.field__label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-700);
}
.field__required { color: var(--color-danger); margin-left: 2px; }

.field__hint {
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
}
.field__error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}
</style>
