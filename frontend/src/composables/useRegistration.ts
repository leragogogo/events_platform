import { ref, computed } from "vue";
import { useQueryClient } from "@tanstack/vue-query";
import { createRegistration, cancelRegistration } from "../api/registrations";
import type { Registration } from "../api/registrations";

export function useRegistration(eventId: string) {
  const queryClient = useQueryClient();
  const cacheKey = ["registration", eventId];

  const registration = ref<Registration | null>(
    queryClient.getQueryData<Registration>(cacheKey) ?? null
  );
  const loading = ref(false);
  const error = ref("");

  const isRegistered = computed(() => registration.value !== null);

  async function register() {
    loading.value = true;
    error.value = "";
    try {
      const res = await createRegistration(eventId);
      registration.value = res.data.registration;
      queryClient.setQueryData(cacheKey, res.data.registration);
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to register. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  async function cancel() {
    if (!registration.value) return;
    loading.value = true;
    error.value = "";
    try {
      await cancelRegistration(registration.value._id);
      registration.value = null;
      queryClient.removeQueries({ queryKey: cacheKey });
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to cancel registration. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return { isRegistered, registration, loading, error, register, cancel };
}
