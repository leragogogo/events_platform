import { useRegister } from "../../composables/useRegister";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";

jest.mock("vue-router", () => ({ useRouter: jest.fn() }));
jest.mock("../../stores/auth", () => ({ useAuthStore: jest.fn() }));

describe("useRegister", () => {
  let push: jest.Mock;
  let register: jest.Mock;

  beforeEach(() => {
    push = jest.fn();
    register = jest.fn().mockResolvedValue(undefined);
    jest.mocked(useRouter).mockReturnValue({ push } as any);
    jest.mocked(useAuthStore).mockReturnValue({ register } as any);
  });

  describe("validation", () => {
    it("sets name error when name is empty", async () => {
      const { email, password, confirmPassword, errors, submit } = useRegister();
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(errors.value.name).toBe("Name is required");
      expect(register).not.toHaveBeenCalled();
    });

    it("sets email error when email is empty", async () => {
      const { name, password, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(errors.value.email).toBe("Email is required");
      expect(register).not.toHaveBeenCalled();
    });

    it("sets email error when email format is invalid", async () => {
      const { name, email, password, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "not-an-email";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(errors.value.email).toBe("Enter a valid email");
    });

    it("sets password error when password is empty", async () => {
      const { name, email, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      confirmPassword.value = "secret123";
      await submit();
      expect(errors.value.password).toBe("Password is required");
    });

    it("sets password error when password is shorter than 8 characters", async () => {
      const { name, email, password, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "short";
      confirmPassword.value = "short";
      await submit();
      expect(errors.value.password).toBe("Password must be at least 8 characters");
    });

    it("sets confirmPassword error when confirmPassword is empty", async () => {
      const { name, email, password, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      await submit();
      expect(errors.value.confirmPassword).toBe("Please confirm your password");
    });

    it("sets confirmPassword error when passwords do not match", async () => {
      const { name, email, password, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "different";
      await submit();
      expect(errors.value.confirmPassword).toBe("Passwords do not match");
    });

    it("has no errors with valid inputs", async () => {
      const { name, email, password, confirmPassword, errors, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(errors.value).toEqual({});
    });
  });

  describe("submit", () => {
    it("navigates to feed on success", async () => {
      const { name, email, password, confirmPassword, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(push).toHaveBeenCalledWith({ name: "feed" });
    });

    it("sets serverError from API response on failure", async () => {
      register.mockRejectedValue({ response: { data: { message: "Email already in use" } } });
      const { name, email, password, confirmPassword, serverError, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(serverError.value).toBe("Email already in use");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      register.mockRejectedValue(new Error("Network error"));
      const { name, email, password, confirmPassword, serverError, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(serverError.value).toBe("Registration failed. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { name, email, password, confirmPassword, loading, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      register.mockRejectedValue(new Error("fail"));
      const { name, email, password, confirmPassword, loading, submit } = useRegister();
      name.value = "Alice";
      email.value = "test@example.com";
      password.value = "secret123";
      confirmPassword.value = "secret123";
      await submit();
      expect(loading.value).toBe(false);
    });
  });
});
