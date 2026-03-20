<script setup lang="ts">
import { useSearch } from "../composables/useSearch";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import EventCard from "../components/EventCard.vue";

const { query, users, events, isLoading, isError, showResults } = useSearch();
</script>

<template>
  <div class="feed">
    <div class="feed__search">
      <BaseInput
        v-model="query"
        placeholder="Search people or events..."
      />
    </div>

    <template v-if="!showResults">
      <EmptyState
        title="Search the platform"
        description="Type at least 2 characters to search for people or events."
      />
    </template>

    <template v-else-if="isLoading">
      <div class="feed__spinner">
        <BaseSpinner size="lg" />
      </div>
    </template>

    <template v-else-if="isError">
      <EmptyState
        title="Something went wrong"
        description="Failed to load search results. Please try again."
      />
    </template>

    <template v-else>
      <section class="feed__section">
        <h2 class="feed__section-title">People</h2>
        <p v-if="users.length === 0" class="feed__empty">No people found.</p>
        <ul v-else class="feed__people">
          <li v-for="user in users" :key="user._id">
            <RouterLink
              :to="{ name: 'user-profile', params: { id: user._id } }"
              class="feed__person"
            >
              {{ user.name }}
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="feed__section">
        <h2 class="feed__section-title">Events</h2>
        <p v-if="events.length === 0" class="feed__empty">No events found.</p>
        <div v-else class="feed__events">
          <EventCard v-for="event in events" :key="event._id" :event="event" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.feed {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.feed__search {
  max-width: 480px;
}

.feed__spinner {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.feed__section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feed__section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-neutral-900);
}

.feed__empty {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

.feed__people {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.feed__person {
  display: block;
  padding: var(--space-3) var(--space-4);
  background: #fff;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  text-decoration: none;
  color: var(--color-neutral-900);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: box-shadow 0.15s, border-color 0.15s;
}

.feed__person:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--color-neutral-300);
}

.feed__events {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
