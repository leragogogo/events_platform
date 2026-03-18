<script setup lang="ts">
defineProps<{
  modelValue: string | number;
  type?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
}>();

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <div class="input-wrapper">
    <input
      :id="id"
      :type="type ?? 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :class="['input', { 'input--error': error }]"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="input__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.input-wrapper { display: flex; flex-direction: column; gap: var(--space-1); }

.input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-900);
  background-color: #fff;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.15);
}
.input:disabled { background-color: var(--color-neutral-100); cursor: not-allowed; }
.input--error { border-color: var(--color-danger); }
.input--error:focus { box-shadow: 0 0 0 3px rgb(220 38 38 / 0.15); }

.input__error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
}
</style>
