import { useLogin } from "../../composables/useLogin";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";

vi.mock("vue-router", () => ({ useRouter: vi.fn() }));
vi.mock("../../stores/auth", () => ({ useAuthStore: vi.fn() }));

describe("useLogin", () => {
  let push: ReturnType<typeof vi.fn>;
  let login: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    push = vi.fn();
    login = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(useAuthStore).mockReturnValue({ login } as any);
  });

  describe("validation", () => {
    it("sets email error when email is empty", async () => {
      const { password, errors, submit } = useLogin();
      password.value = "secret123";
      await submit();
      expect(errors.value.email).toBe("Email is required");
      expect(login).not.toHaveBeenCalled();
    });

    it("sets email error when email format is invalid", async () => {
      const { email, password, errors, submit } = useLogin();
      email.value = "not-an-email";
      password.value = "secret123";
      await submit();
      expect(errors.value.email).toBe("Enter a valid email");
      expect(login).not.toHaveBeenCalled();
    });

    it("sets password error when password is empty", async () => {
      const { email, errors, submit } = useLogin();
      email.value = "test@example.com";
      await submit();
      expect(errors.value.password).toBe("Password is required");
      expect(login).not.toHaveBeenCalled();
    });

    it("has no errors with valid inputs", async () => {
      const { email, password, errors, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(errors.value).toEqual({});
    });
  });

  describe("submit", () => {
    it("navigates to feed on success", async () => {
      const { email, password, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(push).toHaveBeenCalledWith({ name: "feed" });
    });

    it("sets serverError from API response on failure", async () => {
      login.mockRejectedValue({ response: { data: { message: "Invalid credentials" } } });
      const { email, password, serverError, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "wrongpassword";
      await submit();
      expect(serverError.value).toBe("Invalid credentials");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      login.mockRejectedValue(new Error("Network error"));
      const { email, password, serverError, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(serverError.value).toBe("Login failed. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { email, password, loading, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      login.mockRejectedValue(new Error("fail"));
      const { email, password, loading, submit } = useLogin();
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(loading.value).toBe(false);
    });
  });
});
