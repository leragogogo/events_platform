import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { updateMyName } from "../api/users";

export function useUpdateName() {
  const router = useRouter();
  const auth = useAuthStore();

  const name = ref(auth.user?.name ?? "");
  const error = ref<string | undefined>(undefined);
  const serverError = ref("");
  const loading = ref(false);

  function validate(): boolean {
    if (!name.value.trim()) {
      error.value = "Name is required";
      return false;
    }
    error.value = undefined;
    return true;
  }

  async function submit() {
    serverError.value = "";
    if (!validate()) return;

    loading.value = true;
    try {
      const res = await updateMyName(name.value.trim());
      auth.user = res.data.user;
      router.push({ name: "profile" });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Failed to update name. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return { name, error, serverError, loading, submit };
}
