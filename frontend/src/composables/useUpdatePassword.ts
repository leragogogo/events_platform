import { ref } from "vue";
import { useRouter } from "vue-router";
import { updateMyPassword } from "../api/users";

interface PasswordErrors {
  password?: string;
  confirmPassword?: string;
}

export function useUpdatePassword() {
  const router = useRouter();

  const password = ref("");
  const confirmPassword = ref("");
  const errors = ref<PasswordErrors>({});
  const serverError = ref("");
  const loading = ref(false);

  function validate(): boolean {
    const e: PasswordErrors = {};
    if (!password.value) e.password = "Password is required";
    else if (password.value.length < 8) e.password = "Password must be at least 8 characters";
    if (!confirmPassword.value) e.confirmPassword = "Please confirm your password";
    else if (confirmPassword.value !== password.value) e.confirmPassword = "Passwords do not match";
    errors.value = e;
    return Object.keys(e).length === 0;
  }

  async function submit() {
    serverError.value = "";
    if (!validate()) return;

    loading.value = true;
    try {
      await updateMyPassword(password.value);
      router.push({ name: "profile" });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Failed to update password. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return { password, confirmPassword, errors, serverError, loading, submit };
}
