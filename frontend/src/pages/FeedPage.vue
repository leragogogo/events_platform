<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/auth";
import { useSearch } from "../composables/useSearch";
import { useActivityFeed } from "../composables/useActivityFeed";
import { useEventMap } from "../composables/useEventMap";
import { getCategories } from "../api/events";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import EventCard from "../components/EventCard.vue";
import EventMap from "../components/EventMap.vue";

const auth = useAuthStore();
const isLoggedIn = computed(() => !!auth.user);

const { query, users, events, isLoading, isError, showResults } = useSearch();
const {
  activities,
  isLoading: activityLoading,
  isError: activityError,
} = useActivityFeed({ enabled: isLoggedIn });

// Map filters
const mapCategory = ref("");
const mapDateFrom = ref("");
const mapDateTo = ref("");

const hasActiveFilters = computed(
  () => !!mapCategory.value || !!mapDateFrom.value || !!mapDateTo.value,
);

function clearFilters() {
  mapCategory.value = "";
  mapDateFrom.value = "";
  mapDateTo.value = "";
}

const {
  events: mapEvents,
  isLoading: mapLoading,
  isError: mapError,
} = useEventMap({ category: mapCategory, dateFrom: mapDateFrom, dateTo: mapDateTo });

// Categories for filter dropdown
const { data: categoriesData } = useQuery({
  queryKey: ["categories"],
  queryFn: () => getCategories().then((r) => r.data.categories),
});
const categories = computed<string[]>(() => categoriesData.value ?? []);

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
</script>

<template>
  <div class="feed">
    <div v-if="isLoggedIn" class="feed__content">
      <BaseInput
        v-model="query"
        placeholder="Search people or events..."
      />
    </div>

    <template v-if="!showResults">
      <section class="feed__map-section">
        <div class="feed__filters">
          <select v-model="mapCategory" class="feed__filter-select">
            <option value="">All categories</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
          <BaseInput
            v-model="mapDateFrom"
            type="date"
            placeholder="From date"
            class="feed__filter-date"
          />
          <BaseInput
            v-model="mapDateTo"
            type="date"
            placeholder="To date"
            class="feed__filter-date"
          />
          <BaseButton
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            @click="clearFilters"
          >
            Clear ×
          </BaseButton>
        </div>

        <div v-if="mapLoading" class="feed__spinner">
          <BaseSpinner size="lg" />
        </div>
        <EmptyState
          v-else-if="mapError"
          title="Something went wrong"
          description="Failed to load map events. Please try again."
        />
        <EventMap v-else :events="mapEvents" />
      </section>

      <div class="feed__content">
        <template v-if="isLoggedIn">
          <section class="feed__section">
            <h2 class="feed__section-title">Recent Activity</h2>

            <div v-if="activityLoading" class="feed__spinner">
              <BaseSpinner size="lg" />
            </div>

            <EmptyState
              v-else-if="activityError"
              title="Something went wrong"
              description="Failed to load activity. Please try again."
            />

            <EmptyState
              v-else-if="activities.length === 0"
              title="No recent activity"
              description="Connect with people to see when they create or register for events."
            />

            <ul v-else class="feed__activity-list">
              <li v-for="item in activities" :key="item._id" class="activity-item">
                <RouterLink
                  :to="{ name: 'user-profile', params: { id: item.actorId._id } }"
                  class="activity-item__actor"
                >{{ item.actorId.name }}</RouterLink>
                <span class="activity-item__verb">
                  {{ item.type === "created" ? "created" : "registered for" }}
                </span>
                <RouterLink
                  :to="{ name: 'event-detail', params: { id: item.eventId._id } }"
                  class="activity-item__event"
                >{{ item.eventId.title }}</RouterLink>
                <span class="activity-item__time">{{ timeAgo(item.createdAt) }}</span>
              </li>
            </ul>
          </section>
        </template>

        <section v-else class="feed__cta">
          <h2 class="feed__cta-title">See what's happening</h2>
          <p class="feed__cta-text">
            Sign in or create an account to search events, follow people, and see
            their activity right here.
          </p>
          <div class="feed__cta-actions">
            <RouterLink :to="{ name: 'login' }" class="feed__cta-btn feed__cta-btn--primary">
              Sign in
            </RouterLink>
            <RouterLink :to="{ name: 'register' }" class="feed__cta-btn feed__cta-btn--secondary">
              Create account
            </RouterLink>
          </div>
        </section>
      </div>
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
      <section class="feed__section feed__content">
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

      <section class="feed__section feed__content">
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
  margin: 0 auto;
  padding: var(--space-8) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

/* Narrow wrapper for search input and activity list */
.feed__content {
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feed__map-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.feed__filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.feed__filter-select {
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-900);
  background-color: #fff;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s;
}

.feed__filter-select:focus {
  border-color: var(--color-primary);
}

.feed__filter-date {
  width: 160px;
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

.feed__activity-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.activity-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  background: #fff;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-sm);
}

.activity-item__actor {
  font-weight: 600;
  color: var(--color-neutral-900);
  text-decoration: none;
}
.activity-item__actor:hover { text-decoration: underline; }

.activity-item__verb {
  color: var(--color-neutral-500);
}

.activity-item__event {
  font-weight: 500;
  color: var(--color-primary);
  text-decoration: none;
}
.activity-item__event:hover { text-decoration: underline; }

.activity-item__time {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--color-neutral-400);
  white-space: nowrap;
}

.feed__cta {
  padding: var(--space-8) var(--space-6);
  background: #fff;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-4);
}

.feed__cta-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--color-neutral-900);
}

.feed__cta-text {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  max-width: 400px;
  line-height: 1.6;
}

.feed__cta-actions {
  display: flex;
  gap: var(--space-3);
  flex-wrap: wrap;
  justify-content: center;
}

.feed__cta-btn {
  display: inline-block;
  padding: var(--space-2) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-decoration: none;
  transition: opacity 0.15s;
}
.feed__cta-btn:hover { opacity: 0.85; }

.feed__cta-btn--primary {
  background-color: var(--color-primary);
  color: #fff;
}

.feed__cta-btn--secondary {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-800);
  border: 1px solid var(--color-neutral-200);
}
</style>
