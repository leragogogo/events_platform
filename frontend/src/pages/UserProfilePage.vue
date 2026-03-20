<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { getUserProfile } from "../api/users";
import type { UserProfileConnected } from "../api/users";
import { useAuthStore } from "../stores/auth";
import { useConnection } from "../composables/useConnection";
import UserAvatar from "../components/ui/UserAvatar.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import EventCard from "../components/EventCard.vue";

const route = useRoute();
const userId = route.params.id as string;
const auth = useAuthStore();

const { data: profile, isLoading, isError } = useQuery({
  queryKey: ["user-profile", userId],
  queryFn: () => getUserProfile(userId).then((r) => r.data),
});

const isOwnProfile = computed(() => auth.user?._id === userId);

const { status, loading: connLoading, error: connError, connect, approve, decline, remove } = useConnection(userId);

const isConnected = computed(
  () => profile.value != null && "createdEvents" in profile.value
);

const connected = computed(() =>
  isConnected.value ? (profile.value as UserProfileConnected) : null
);

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
          <p class="profile-header__since">Member since {{ formatMemberSince(profile.user.createdAt) }}</p>
        </div>

        <!-- Connection actions -->
        <div v-if="!isOwnProfile" class="profile-header__connection">
          <p v-if="connError" class="profile-header__conn-error">{{ connError }}</p>

          <template v-if="status === 'none'">
            <BaseButton size="sm" :loading="connLoading" @click="connect">Connect</BaseButton>
          </template>

          <template v-else-if="status === 'pending_sent'">
            <BaseButton size="sm" variant="secondary" disabled>Pending…</BaseButton>
          </template>

          <template v-else-if="status === 'pending_received'">
            <BaseButton size="sm" :loading="connLoading" @click="approve">Approve</BaseButton>
            <BaseButton size="sm" variant="secondary" :loading="connLoading" @click="decline">Decline</BaseButton>
          </template>

          <template v-else-if="status === 'approved'">
            <BaseButton size="sm" variant="secondary" :loading="connLoading" @click="remove">
              Remove connection
            </BaseButton>
          </template>
        </div>
      </div>

      <!-- Connected: show full event lists -->
      <template v-if="connected">
        <section class="profile-section">
          <h2 class="profile-section__title">Created events</h2>
          <div v-if="connected.createdEvents.length" class="profile-section__grid">
            <EventCard v-for="event in connected.createdEvents" :key="event._id" :event="event" />
          </div>
          <EmptyState v-else title="No events created yet" />
        </section>

        <section class="profile-section">
          <h2 class="profile-section__title">Participated events</h2>
          <div v-if="connected.participatedEvents.length" class="profile-section__grid">
            <EventCard v-for="event in connected.participatedEvents" :key="event._id" :event="event" />
          </div>
          <EmptyState v-else title="No events attended yet" />
        </section>
      </template>

      <!-- Not connected: show counts only -->
      <template v-else>
        <div class="profile-counts">
          <div class="profile-count">
            <span class="profile-count__value">{{ (profile as any).createdEventsCount }}</span>
            <span class="profile-count__label">Events created</span>
          </div>
          <div class="profile-count">
            <span class="profile-count__value">{{ (profile as any).participatedEventsCount }}</span>
            <span class="profile-count__label">Events attended</span>
          </div>
        </div>
        <p v-if="!isOwnProfile" class="profile-connect-hint">Connect to see this user's full event history.</p>
      </template>
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

.profile-header__since {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

.profile-header__connection {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.profile-header__conn-error {
  font-size: var(--font-size-xs);
  color: var(--color-danger);
  width: 100%;
}

.profile-section {
  margin-bottom: var(--space-10);
}

.profile-section__title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-4);
}

.profile-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.profile-counts {
  display: flex;
  gap: var(--space-8);
  margin-bottom: var(--space-6);
}

.profile-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.profile-count__value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.profile-count__label {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

.profile-connect-hint {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}
</style>
