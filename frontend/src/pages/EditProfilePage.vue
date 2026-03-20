<script setup lang="ts">
import { useUpdateName } from "../composables/useUpdateName";
import { useUpdatePassword } from "../composables/useUpdatePassword";
import FormField from "../components/ui/FormField.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import BaseButton from "../components/ui/BaseButton.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const nameForm = useUpdateName();
const passwordForm = useUpdatePassword();
</script>

<template>
  <div class="edit-profile">
    <div class="edit-profile__header">
      <RouterLink :to="{ name: 'profile' }" class="edit-profile__back">Back to profile</RouterLink>
      <h1 class="edit-profile__title">Edit profile</h1>
    </div>

    <div class="edit-profile__sections">
      <!-- Update name -->
      <section class="edit-section">
        <h2 class="edit-section__title">Name</h2>
        <form novalidate @submit.prevent="nameForm.submit">
          <ErrorMessage v-if="nameForm.serverError.value" :message="nameForm.serverError.value" class="edit-section__error" />
          <FormField label="Full name" required :error="nameForm.error.value">
            <template #default="{ id, error }">
              <BaseInput
                :id="id"
                v-model="nameForm.name.value"
                placeholder="Your name"
                :error="error"
              />
            </template>
          </FormField>
          <div class="edit-section__actions">
            <BaseButton type="submit" size="sm" :loading="nameForm.loading.value">
              Save name
            </BaseButton>
          </div>
        </form>
      </section>

      <!-- Update password -->
      <section class="edit-section">
        <h2 class="edit-section__title">Password</h2>
        <form novalidate @submit.prevent="passwordForm.submit">
          <ErrorMessage v-if="passwordForm.serverError.value" :message="passwordForm.serverError.value" class="edit-section__error" />
          <div class="edit-section__fields">
            <FormField label="New password" required :error="passwordForm.errors.value.password" hint="At least 8 characters">
              <template #default="{ id, error }">
                <BaseInput
                  :id="id"
                  v-model="passwordForm.password.value"
                  type="password"
                  placeholder="New password"
                  :error="error"
                  autocomplete="new-password"
                />
              </template>
            </FormField>
            <FormField label="Confirm password" required :error="passwordForm.errors.value.confirmPassword">
              <template #default="{ id, error }">
                <BaseInput
                  :id="id"
                  v-model="passwordForm.confirmPassword.value"
                  type="password"
                  placeholder="Repeat new password"
                  :error="error"
                  autocomplete="new-password"
                />
              </template>
            </FormField>
          </div>
          <div class="edit-section__actions">
            <BaseButton type="submit" size="sm" :loading="passwordForm.loading.value">
              Save password
            </BaseButton>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.edit-profile__header {
  margin-bottom: var(--space-8);
}

.edit-profile__back {
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
  text-decoration: none;
  display: inline-block;
  margin-bottom: var(--space-2);
}
.edit-profile__back:hover {
  color: var(--color-neutral-700);
  text-decoration: underline;
}

.edit-profile__title {
  font-size: var(--font-size-2xl);
}

.edit-profile__sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 480px;
}

.edit-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-6);
  background: #fff;
  border: 1px solid var(--color-neutral-200);
  border-radius: var(--radius-xl);
}

.edit-section__title {
  font-size: var(--font-size-base);
  font-weight: 600;
}

.edit-section__fields {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.edit-section__error {
  margin-bottom: var(--space-2);
}

.edit-section__actions {
  display: flex;
  justify-content: flex-end;
  padding-top: var(--space-2);
}
</style>
