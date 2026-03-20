<script setup lang="ts">
import { computed, ref } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { getMyProfile } from "../api/users";
import { getMyConnections, updateConnectionStatus, type Connection } from "../api/connections";
import { useAuthStore } from "../stores/auth";
import UserAvatar from "../components/ui/UserAvatar.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import EventCard from "../components/EventCard.vue";

const auth = useAuthStore();
const queryClient = useQueryClient();

const { data: profile, isLoading, isError } = useQuery({
  queryKey: ["my-profile"],
  queryFn: () => getMyProfile().then((r) => r.data),
});

const { data: connectionsData } = useQuery({
  queryKey: ["my-connections"],
  queryFn: () => getMyConnections().then((r) => r.data.connections),
});

const pendingRequests = computed(() =>
  connectionsData.value?.filter(
    (c) => c.status === "pending" && c.addresseeId._id === auth.user?._id
  ) ?? []
);

const approvedConnections = computed(() =>
  connectionsData.value?.filter((c) => c.status === "approved") ?? []
);

function otherUser(c: Connection) {
  return c.requesterId._id === auth.user?._id ? c.addresseeId : c.requesterId;
}

const actingOnId = ref<string | null>(null);

async function handleApprove(c: Connection) {
  actingOnId.value = c._id;
  try {
    await updateConnectionStatus(c._id, "approved");
    queryClient.invalidateQueries({ queryKey: ["my-connections"] });
  } finally {
    actingOnId.value = null;
  }
}

async function handleDecline(c: Connection) {
  actingOnId.value = c._id;
  try {
    await updateConnectionStatus(c._id, "declined");
    queryClient.invalidateQueries({ queryKey: ["my-connections"] });
  } finally {
    actingOnId.value = null;
  }
}

function formatMemberSince(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(iso));
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="profile-spinner">
      <BaseSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="isError"
      message="Failed to load profile. Please try again."
    />

    <template v-else-if="profile">
      <div class="profile-header">
        <UserAvatar :name="profile.user.name" size="lg" />
        <div class="profile-header__info">
          <h1 class="profile-header__name">{{ profile.user.name }}</h1>
          <p class="profile-header__email">{{ profile.user.email }}</p>
          <p class="profile-header__since">Member since {{ formatMemberSince(profile.user.createdAt) }}</p>
        </div>
        <RouterLink :to="{ name: 'profile-edit' }" class="profile-header__edit">
          <BaseButton variant="secondary" size="sm">Edit profile</BaseButton>
        </RouterLink>
      </div>

      <!-- Pending connection requests -->
      <section v-if="pendingRequests.length" class="profile-section">
        <h2 class="profile-section__title">Connection requests</h2>
        <ul class="conn-list">
          <li v-for="c in pendingRequests" :key="c._id" class="conn-item">
            <RouterLink
              :to="{ name: 'user-profile', params: { id: c.requesterId._id } }"
              class="conn-item__name"
            >
              {{ c.requesterId.name }}
            </RouterLink>
            <div class="conn-item__actions">
              <BaseButton size="sm" :loading="actingOnId === c._id" @click="handleApprove(c)">
                Approve
              </BaseButton>
              <BaseButton size="sm" variant="secondary" :loading="actingOnId === c._id" @click="handleDecline(c)">
                Decline
              </BaseButton>
            </div>
          </li>
        </ul>
      </section>

      <!-- Approved connections -->
      <section class="profile-section">
        <h2 class="profile-section__title">
          Connections
          <span class="profile-section__count">{{ approvedConnections.length }}</span>
        </h2>
        <ul v-if="approvedConnections.length" class="conn-list">
          <li v-for="c in approvedConnections" :key="c._id" class="conn-item">
            <RouterLink
              :to="{ name: 'user-profile', params: { id: otherUser(c)._id } }"
              class="conn-item__name"
            >
              {{ otherUser(c).name }}
            </RouterLink>
          </li>
        </ul>
        <EmptyState v-else title="No connections yet" />
      </section>

      <section class="profile-section">
        <h2 class="profile-section__title">Created events</h2>
        <div v-if="profile.createdEvents.length" class="profile-section__grid">
          <EventCard v-for="event in profile.createdEvents" :key="event._id" :event="event" />
        </div>
        <EmptyState v-else title="No events created yet" />
      </section>

      <section class="profile-section">
        <h2 class="profile-section__title">Participated events</h2>
        <div v-if="profile.participatedEvents.length" class="profile-section__grid">
          <EventCard v-for="event in profile.participatedEvents" :key="event._id" :event="event" />
        </div>
        <EmptyState v-else title="No events attended yet" />
      </section>
    </template>
  </div>
</template>

<style scoped>
.profile-spinner {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-5);
  padding-bottom: var(--space-8);
  border-bottom: 1px solid var(--color-neutral-200);
  margin-bottom: var(--space-8);
}

.profile-header__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.profile-header__name {
  font-size: var(--font-size-2xl);
}

.profile-header__email,
.profile-header__since {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

.profile-section {
  margin-bottom: var(--space-10);
}

.profile-section__title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.profile-section__count {
  font-size: var(--font-size-sm);
  font-weight: 400;
  color: var(--color-neutral-500);
}

.profile-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.conn-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.conn-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-md);
}

.conn-item__name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-neutral-900);
  text-decoration: none;
}

.conn-item__name:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.conn-item__actions {
  display: flex;
  gap: var(--space-2);
}
</style>
