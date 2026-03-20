<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { getEvent, deleteEvent } from "../api/events";
import { useAuthStore } from "../stores/auth";
import { useRegistration } from "../composables/useRegistration";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseModal from "../components/ui/BaseModal.vue";
import BaseBadge from "../components/ui/BaseBadge.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const route = useRoute();
const router = useRouter();
const queryClient = useQueryClient();
const auth = useAuthStore();

const id = route.params.id as string;
const confirmDeleteOpen = ref(false);
const deleting = ref(false);

const { data: event, isLoading, isError } = useQuery({
  queryKey: ["event", id],
  queryFn: () => getEvent(id).then((r) => r.data.event),
});

async function doDelete() {
  deleting.value = true;
  try {
    await deleteEvent(id);
    queryClient.invalidateQueries({ queryKey: ["events"] });
    router.push({ name: "events" });
  } finally {
    deleting.value = false;
  }
}

const isOwner = () => event.value?.createdByUserId === auth.user?._id;

const {
  isRegistered, loading: regLoading, error: regError, register, cancel,
} = useRegistration(id);

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="detail-spinner">
      <BaseSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="isError"
      message="Failed to load event. Please try again."
    />

    <template v-else-if="event">
      <div class="detail-header">
        <div class="detail-header__top">
          <BaseBadge variant="primary">{{ event.category }}</BaseBadge>
          <div v-if="isOwner()" class="detail-header__actions">
            <RouterLink :to="{ name: 'event-edit', params: { id: event._id } }">
              <BaseButton variant="secondary" size="sm">Edit</BaseButton>
            </RouterLink>
            <BaseButton variant="danger" size="sm" @click="confirmDeleteOpen = true">
              Delete
            </BaseButton>
          </div>
        </div>

        <h1 class="detail-title">{{ event.title }}</h1>

        <div class="detail-meta">
          <span>{{ formatDate(event.dateTime) }}</span>
          <span>{{ event.address }}, {{ event.city }}</span>
          <span>{{ event.capacity }} spots</span>
        </div>
      </div>

      <p class="detail-description">{{ event.description }}</p>

      <div v-if="!isOwner()" class="detail-registration">
        <ErrorMessage v-if="regError" :message="regError" />
        <BaseButton
          v-if="isRegistered"
          variant="secondary"
          :loading="regLoading"
          @click="cancel"
        >
          Cancel registration
        </BaseButton>
        <BaseButton v-else :loading="regLoading" @click="register">
          Register
        </BaseButton>
      </div>
    </template>

    <!-- Delete confirmation modal -->
    <BaseModal
      title="Delete event"
      :open="confirmDeleteOpen"
      @close="confirmDeleteOpen = false"
    >
      <p>Are you sure you want to delete <strong>{{ event?.title }}</strong>? This cannot be undone.</p>
      <template #footer>
        <BaseButton variant="secondary" @click="confirmDeleteOpen = false">Cancel</BaseButton>
        <BaseButton variant="danger" :loading="deleting" @click="doDelete()">Delete</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<style scoped>
.detail-spinner {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.detail-header {
  margin-bottom: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.detail-header__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.detail-header__actions {
  display: flex;
  gap: var(--space-2);
}

.detail-title {
  font-size: var(--font-size-3xl);
  line-height: 1.2;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-5);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  padding-top: var(--space-1);
}

.detail-registration {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  margin-top: var(--space-6);
}

.detail-description {
  font-size: var(--font-size-base);
  color: var(--color-neutral-700);
  line-height: 1.7;
  white-space: pre-wrap;
  max-width: 720px;
}
</style>
