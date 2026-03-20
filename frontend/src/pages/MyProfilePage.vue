<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { getMyProfile } from "../api/users";
import UserAvatar from "../components/ui/UserAvatar.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";
import EmptyState from "../components/ui/EmptyState.vue";
import EventCard from "../components/EventCard.vue";

const { data: profile, isLoading, isError } = useQuery({
  queryKey: ["my-profile"],
  queryFn: () => getMyProfile().then((r) => r.data),
});

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
}

.profile-section__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}
</style>
