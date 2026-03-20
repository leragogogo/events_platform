<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/auth";
import { getEventsByUser } from "../api/events";
import EventCard from "../components/EventCard.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const auth = useAuthStore();
const userId = auth.user!._id;

const { data: events, isLoading, isError } = useQuery({
  queryKey: ["events", "user", userId],
  queryFn: () => getEventsByUser(userId).then((r) => r.data.events),
});
</script>

<template>
  <div class="events-page">
    <div class="events-page__header">
      <h1 class="events-page__title">My Events</h1>
      <RouterLink :to="{ name: 'events-create' }">
        <BaseButton size="sm">New event</BaseButton>
      </RouterLink>
    </div>

    <div v-if="isLoading" class="events-page__spinner">
      <BaseSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="isError"
      message="Failed to load events. Please try again."
    />

    <template v-else>
      <div v-if="events?.length" class="events-page__grid">
        <EventCard v-for="event in events" :key="event._id" :event="event" />
      </div>
      <EmptyState
        v-else
        title="No events yet"
        description="Create your first event to get started."
      >
        <template #action>
          <RouterLink :to="{ name: 'events-create' }">
            <BaseButton>Create event</BaseButton>
          </RouterLink>
        </template>
      </EmptyState>
    </template>
  </div>
</template>

<style scoped>
.events-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}

.events-page__title {
  font-size: var(--font-size-2xl);
}

.events-page__spinner {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.events-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-4);
}
</style>
