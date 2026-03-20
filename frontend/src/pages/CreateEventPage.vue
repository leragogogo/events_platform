<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { getCategories } from "../api/events";
import { useCreateEvent } from "../composables/useCreateEvent";
import EventForm from "../components/EventForm.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const { data: categoriesData } = useQuery({
  queryKey: ["categories"],
  queryFn: () => getCategories().then((r) => r.data.categories),
  staleTime: Infinity,
});

const {
  title, description, category, dateTime,
  address, city, longitude, latitude, capacity,
  errors, serverError, isPending, submit,
} = useCreateEvent();
</script>

<template>
  <div class="form-page">
    <h1 class="form-page__title">Create Event</h1>

    <ErrorMessage v-if="serverError" :message="serverError" class="form-page__error" />

    <EventForm
      v-model:title="title"
      v-model:description="description"
      v-model:category="category"
      v-model:dateTime="dateTime"
      v-model:address="address"
      v-model:city="city"
      v-model:longitude="longitude"
      v-model:latitude="latitude"
      v-model:capacity="capacity"
      :errors="errors"
      :categories="categoriesData ?? []"
      :loading="isPending"
      submit-label="Create event"
      @submit="submit"
    />
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

.form-page__error {
  margin-bottom: var(--space-5);
}
</style>
