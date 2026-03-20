<script setup lang="ts">
import { watch } from "vue";
import { useRoute } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import { getEvent, getCategories } from "../api/events";
import { useEditEvent } from "../composables/useEditEvent";
import EventForm from "../components/EventForm.vue";
import BaseSpinner from "../components/ui/BaseSpinner.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const route = useRoute();
const id = route.params.id as string;

const { data: event, isLoading, isError } = useQuery({
  queryKey: ["event", id],
  queryFn: () => getEvent(id).then((r) => r.data.event),
});

const { data: categoriesData } = useQuery({
  queryKey: ["categories"],
  queryFn: () => getCategories().then((r) => r.data.categories),
  staleTime: Infinity,
});

const {
  title, description, category, dateTime,
  address, capacity,
  errors, serverError, isPending, submit, fill,
  isGeocoding, geocodeError, handleAddressBlur,
} = useEditEvent(id);

watch(event, (e) => { if (e) fill(e); }, { immediate: true });
</script>

<template>
  <div class="form-page">
    <h1 class="form-page__title">Edit Event</h1>

    <div v-if="isLoading" class="form-page__spinner">
      <BaseSpinner size="lg" />
    </div>

    <ErrorMessage
      v-else-if="isError"
      message="Failed to load event. Please try again."
    />

    <template v-else>
      <ErrorMessage v-if="serverError" :message="serverError" class="form-page__error" />

      <EventForm
        v-model:title="title"
        v-model:description="description"
        v-model:category="category"
        v-model:dateTime="dateTime"
        v-model:address="address"
        v-model:capacity="capacity"
        :errors="errors"
        :categories="categoriesData ?? []"
        :loading="isPending"
        :isGeocoding="isGeocoding"
        :geocodeError="geocodeError"
        :handleAddressBlur="handleAddressBlur"
        submit-label="Save changes"
        @submit="submit"
      />
    </template>
  </div>
</template>

<style scoped>
.form-page {
  max-width: 640px;
}

.form-page__title {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-6);
}

.form-page__spinner {
  display: flex;
  justify-content: center;
  padding: var(--space-12) 0;
}

.form-page__error {
  margin-bottom: var(--space-5);
}
</style>
