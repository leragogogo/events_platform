<script setup lang="ts">
import { useLogin } from "../composables/useLogin";
import BaseButton from "../components/ui/BaseButton.vue";
import BaseInput from "../components/ui/BaseInput.vue";
import FormField from "../components/ui/FormField.vue";
import ErrorMessage from "../components/ui/ErrorMessage.vue";

const { email, password, errors, serverError, loading, submit } = useLogin();
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-card__header">
        <h1 class="auth-card__title">Welcome back</h1>
        <p class="auth-card__subtitle">Sign in to your account</p>
      </div>

      <form class="auth-card__form" novalidate @submit.prevent="submit">
        <ErrorMessage v-if="serverError" :message="serverError" />

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

        <FormField label="Password" required :error="errors.password">
          <template #default="{ id, error }">
            <BaseInput
              :id="id"
              v-model="password"
              type="password"
              placeholder="Your password"
              :error="error"
              autocomplete="current-password"
            />
          </template>
        </FormField>

        <BaseButton type="submit" :loading="loading" class="auth-card__submit">
          Sign in
        </BaseButton>
      </form>

      <p class="auth-card__footer">
        Don't have an account?
        <RouterLink :to="{ name: 'register' }" class="auth-card__link">Create one</RouterLink>
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
