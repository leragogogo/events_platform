<script setup lang="ts">
import type { Event } from "../api/events";
import BaseBadge from "./ui/BaseBadge.vue";

defineProps<{ event: Event }>();

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
</script>

<template>
  <RouterLink :to="{ name: 'event-detail', params: { id: event._id } }" class="event-card">
    <div class="event-card__top">
      <h3 class="event-card__title">{{ event.title }}</h3>
      <BaseBadge variant="primary">{{ event.category }}</BaseBadge>
    </div>
    <p class="event-card__description">{{ event.description }}</p>
    <div class="event-card__meta">
      <span>{{ formatDate(event.dateTime) }}</span>
      <span>{{ event.city }}</span>
      <span>{{ event.capacity }} spots</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.event-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background: #fff;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  padding: var(--space-5) var(--space-6);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.event-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-neutral-300);
}

.event-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.event-card__title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--color-neutral-900);
  line-height: 1.4;
}

.event-card__description {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.event-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--color-neutral-500);
  margin-top: var(--space-1);
}
</style>
