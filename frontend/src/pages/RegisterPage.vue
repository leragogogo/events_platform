<script setup lang="ts">
import { useRegister } from "../composables/useRegister";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import FormField from "../components/ui/FormField.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const { name, email, password, confirmPassword, errors, serverError, loading, submit } = useRegister();
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="auth-card__title">Create account</h1>
        <p class="auth-card__subtitle">Join the community</p>
      </div>

      <form class="auth-card__form" novalidate @submit.prevent="submit">
        <ErrorMessage v-if="serverError" :message="serverError" />

        <FormField label="Name" required :error="errors.name">
          <template #default="{ id, error }">
            <BaseInput
              :id="id"
              v-model="name"
              placeholder="Your full name"
              :error="error"
              autocomplete="name"
            />
          </template>
        </FormField>

        <FormField label="Email" required :error="errors.email">
          <template #default="{ id, error }">
            <BaseInput
              :id="id"
              v-model="email"
              type="email"
              placeholder="you@example.com"
              :error="error"
              autocomplete="email"
            />
          </template>
        </FormField>

        <FormField label="Password" required :error="errors.password" hint="At least 8 characters">
          <template #default="{ id, error }">
            <BaseInput
              :id="id"
              v-model="password"
              type="password"
              placeholder="Choose a strong password"
              :error="error"
              autocomplete="new-password"
            />
          </template>
        </FormField>

        <FormField label="Confirm password" required :error="errors.confirmPassword">
          <template #default="{ id, error }">
            <BaseInput
              :id="id"
              v-model="confirmPassword"
              type="password"
              placeholder="Repeat your password"
              :error="error"
              autocomplete="new-password"
            />
          </template>
        </FormField>

        <BaseButton type="submit" :loading="loading" class="auth-card__submit">
          Create account
        </BaseButton>
      </form>

      <p class="auth-card__footer">
        Already have an account?
        <RouterLink :to="{ name: 'login' }" class="auth-card__link">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-4);
  background-color: var(--color-neutral-50);
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: var(--space-8);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.auth-card__header {
  text-align: center;
}
.auth-card__title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--color-neutral-900);
}
.auth-card__subtitle {
  margin-top: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}

.auth-card__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.auth-card__submit {
  width: 100%;
  margin-top: var(--space-2);
}

.auth-card__footer {
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-neutral-500);
}
.auth-card__link {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
}
.auth-card__link:hover {
  text-decoration: underline;
}
</style>
