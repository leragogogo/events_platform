<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  name: string;
  size?: "sm" | "md" | "lg";
}>();

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
});

const colorIndex = computed(() => {
  let hash = 0;
  for (const ch of props.name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % COLORS.length;
});

const COLORS = [
  ["#e0e7ff", "#4338ca"],
  ["#dcfce7", "#15803d"],
  ["#fef9c3", "#a16207"],
  ["#fce7f3", "#be185d"],
  ["#e0f2fe", "#0369a1"],
  ["#f3e8ff", "#7e22ce"],
  ["#ffedd5", "#c2410c"],
];
</script>

<template>
  <span
    :class="['avatar', `avatar--${size ?? 'md'}`]"
    :style="{ backgroundColor: COLORS[colorIndex]![0], color: COLORS[colorIndex]![1] }"
    :aria-label="name"
    role="img"
  >
    {{ initials }}
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  font-weight: 600;
  flex-shrink: 0;
  user-select: none;
}

.avatar--sm {
  width: 28px;
  height: 28px;
  font-size: var(--font-size-xs);
}
.avatar--md {
  width: 36px;
  height: 36px;
  font-size: var(--font-size-sm);
}
.avatar--lg {
  width: 56px;
  height: 56px;
  font-size: var(--font-size-lg);
}
</style>
