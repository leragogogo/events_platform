<script setup lang="ts">
import type { EventFormErrors } from "../composables/useEventForm";
import FormField from "./ui/FormField.vue";
import BaseInput from "./ui/BaseInput.vue";
import BaseButton from "./ui/BaseButton.vue";

const title = defineModel<string>("title", { required: true });
const description = defineModel<string>("description", { required: true });
const category = defineModel<string>("category", { required: true });
const dateTime = defineModel<string>("dateTime", { required: true });
const address = defineModel<string>("address", { required: true });
const city = defineModel<string>("city", { required: true });
const longitude = defineModel<string>("longitude", { required: true });
const latitude = defineModel<string>("latitude", { required: true });
const capacity = defineModel<string>("capacity", { required: true });

defineProps<{
  errors: EventFormErrors;
  categories: string[];
  loading?: boolean;
  submitLabel?: string;
}>();

defineEmits<{ submit: [] }>();
</script>

<template>
  <form class="event-form" novalidate @submit.prevent="$emit('submit')">
    <FormField label="Title" required :error="errors.title">
      <template #default="{ id, error }">
        <BaseInput :id="id" v-model="title" placeholder="Event title" :error="error" />
      </template>
    </FormField>

    <FormField label="Description" required :error="errors.description">
      <template #default="{ id }">
        <textarea
          :id="id"
          v-model="description"
          class="textarea"
          :class="{ 'textarea--error': errors.description }"
          placeholder="Describe the event"
          rows="4"
        />
      </template>
    </FormField>

    <FormField label="Category" required :error="errors.category">
      <template #default="{ id }">
        <select
          :id="id"
          v-model="category"
          class="select"
          :class="{ 'select--error': errors.category }"
        >
          <option value="" disabled>Select a category</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>
      </template>
    </FormField>

    <FormField label="Date and time" required :error="errors.dateTime">
      <template #default="{ id, error }">
        <BaseInput :id="id" v-model="dateTime" type="datetime-local" :error="error" />
      </template>
    </FormField>

    <FormField label="Address" required :error="errors.address">
      <template #default="{ id, error }">
        <BaseInput :id="id" v-model="address" placeholder="Street address" :error="error" />
      </template>
    </FormField>

    <FormField label="City" required :error="errors.city">
      <template #default="{ id, error }">
        <BaseInput :id="id" v-model="city" placeholder="City" :error="error" />
      </template>
    </FormField>

    <FormField
      label="Coordinates"
      required
      hint="Longitude and latitude (e.g. -0.1276, 51.5074)"
      :error="errors.coordinates"
    >
      <template #default="{ id }">
        <div class="event-form__coords">
          <BaseInput
            :id="id"
            v-model="longitude"
            type="number"
            step="any"
            placeholder="Longitude"
            :error="errors.coordinates"
          />
          <BaseInput
            v-model="latitude"
            type="number"
            step="any"
            placeholder="Latitude"
            :error="errors.coordinates"
          />
        </div>
      </template>
    </FormField>

    <FormField label="Capacity" required :error="errors.capacity">
      <template #default="{ id, error }">
        <BaseInput
          :id="id"
          v-model="capacity"
          type="number"
          min="1"
          step="1"
          placeholder="Max number of attendees"
          :error="error"
        />
      </template>
    </FormField>

    <div class="event-form__actions">
      <RouterLink :to="{ name: 'events' }" class="event-form__cancel">Cancel</RouterLink>
      <BaseButton type="submit" :loading="loading">
        {{ submitLabel ?? "Save" }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.event-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-900);
  background-color: #fff;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.5;
}
.textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.15);
}
.textarea--error { border-color: var(--color-danger); }

.select {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-900);
  background-color: #fff;
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-md);
  outline: none;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(79 70 229 / 0.15);
}
.select--error { border-color: var(--color-danger); }

.event-form__coords {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.event-form__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  padding-top: var(--space-2);
}

.event-form__cancel {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  text-decoration: none;
}
.event-form__cancel:hover {
  color: var(--color-neutral-700);
  text-decoration: underline;
}
</style>
