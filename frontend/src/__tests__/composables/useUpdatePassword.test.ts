import { useUpdatePassword } from "../../composables/useUpdatePassword";
import { useRouter } from "vue-router";
import { updateMyPassword } from "../../api/users";

jest.mock("vue-router", () => ({ useRouter: jest.fn() }));
jest.mock("../../api/users", () => ({ updateMyPassword: jest.fn() }));

describe("useUpdatePassword", () => {
  let push: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    push = jest.fn();
    jest.mocked(useRouter).mockReturnValue({ push } as any);
    jest.mocked(updateMyPassword).mockResolvedValue({} as any);
  });

  describe("validation", () => {
    it("sets password error when password is empty", async () => {
      const { errors, submit } = useUpdatePassword();
      await submit();
      expect(errors.value.password).toBe("Password is required");
      expect(updateMyPassword).not.toHaveBeenCalled();
    });

    it("sets password error when password is shorter than 8 characters", async () => {
      const { password, errors, submit } = useUpdatePassword();
      password.value = "short";
      await submit();
      expect(errors.value.password).toBe("Password must be at least 8 characters");
      expect(updateMyPassword).not.toHaveBeenCalled();
    });

    it("sets confirmPassword error when confirmPassword is empty", async () => {
      const { password, errors, submit } = useUpdatePassword();
      password.value = "longpassword";
      await submit();
      expect(errors.value.confirmPassword).toBe("Please confirm your password");
      expect(updateMyPassword).not.toHaveBeenCalled();
    });

    it("sets confirmPassword error when passwords do not match", async () => {
      const { password, confirmPassword, errors, submit } = useUpdatePassword();
      password.value = "password123";
      confirmPassword.value = "different123";
      await submit();
      expect(errors.value.confirmPassword).toBe("Passwords do not match");
      expect(updateMyPassword).not.toHaveBeenCalled();
    });

    it("clears all errors when inputs are valid", async () => {
      const { password, confirmPassword, errors, submit } = useUpdatePassword();
      password.value = "validpass";
      confirmPassword.value = "validpass";
      await submit();
      expect(errors.value).toEqual({});
    });
  });

  describe("submit", () => {
    it("calls updateMyPassword with the password", async () => {
      const { password, confirmPassword, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(updateMyPassword).toHaveBeenCalledWith("newpassword");
    });

    it("navigates to profile on success", async () => {
      const { password, confirmPassword, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(push).toHaveBeenCalledWith({ name: "profile" });
    });

    it("sets serverError from API response on failure", async () => {
      jest.mocked(updateMyPassword).mockRejectedValue({
        response: { data: { message: "Current password is incorrect" } },
      });
      const { password, confirmPassword, serverError, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(serverError.value).toBe("Current password is incorrect");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      jest.mocked(updateMyPassword).mockRejectedValue(new Error("Network error"));
      const { password, confirmPassword, serverError, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(serverError.value).toBe("Failed to update password. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { password, confirmPassword, loading, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      jest.mocked(updateMyPassword).mockRejectedValue(new Error("fail"));
      const { password, confirmPassword, loading, submit } = useUpdatePassword();
      password.value = "newpassword";
      confirmPassword.value = "newpassword";
      await submit();
      expect(loading.value).toBe(false);
    });
  });
});
