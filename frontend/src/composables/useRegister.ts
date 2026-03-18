import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

interface RegisterErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function useRegister() {
  const router = useRouter();
  const auth = useAuthStore();

  const name = ref("");
  const email = ref("");
  const password = ref("");
  const confirmPassword = ref("");
  const errors = ref<RegisterErrors>({});
  const serverError = ref("");
  const loading = ref(false);

  function validate(): boolean {
    const e: RegisterErrors = {};
    if (!name.value.trim()) e.name = "Name is required";
    const trimmedEmail = email.value.trim();
    if (!trimmedEmail) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) e.email = "Enter a valid email";
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
      await auth.register({
        name: name.value.trim(),
        email: email.value.trim(),
        password: password.value,
      });
      router.push({ name: "feed" });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Registration failed. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return { name, email, password, confirmPassword, errors, serverError, loading, submit };
}
