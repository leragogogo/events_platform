import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

interface LoginErrors {
  email?: string;
  password?: string;
}

export function useLogin() {
  const router = useRouter();
  const auth = useAuthStore();

  const email = ref("");
  const password = ref("");
  const errors = ref<LoginErrors>({});
  const serverError = ref("");
  const loading = ref(false);

  function validate(): boolean {
    const e: LoginErrors = {};
    const trimmedEmail = email.value.trim();
    if (!trimmedEmail) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) e.email = "Enter a valid email";
    if (!password.value) e.password = "Password is required";
    errors.value = e;
    return Object.keys(e).length === 0;
  }

  async function submit() {
    serverError.value = "";
    if (!validate()) return;

    loading.value = true;
    try {
      await auth.login({ email: email.value.trim(), password: password.value });
      router.push({ name: "feed" });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Login failed. Please try again.";
    } finally {
      loading.value = false;
    }
  }

  return { email, password, errors, serverError, loading, submit };
}
