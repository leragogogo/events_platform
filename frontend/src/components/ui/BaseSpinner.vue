<script setup lang="ts">
withDefaults(defineProps<{
  size?: "sm" | "md" | "lg";
}>(), { size: "md" });
</script>

<template>
  <span :class="['spinner', `spinner--${size}`]" role="status" aria-label="Loading" />
</template>

<style scoped>
.spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: spin 0.6s linear infinite;
  flex-shrink: 0;
}
.spinner--sm { width: 14px; height: 14px; }
.spinner--md { width: 24px; height: 24px; border-width: 3px; }
.spinner--lg { width: 40px; height: 40px; border-width: 3px; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
