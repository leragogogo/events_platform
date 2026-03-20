import { useUpdateName } from "../../composables/useUpdateName";
import { useAuthStore } from "../../stores/auth";
import { useRouter } from "vue-router";
import { updateMyName } from "../../api/users";

vi.mock("vue-router", () => ({ useRouter: vi.fn() }));
vi.mock("../../stores/auth", () => ({ useAuthStore: vi.fn() }));
vi.mock("../../api/users", () => ({ updateMyName: vi.fn() }));

const mockUser = { _id: "user-1", name: "Alice", email: "alice@example.com", createdAt: "2024-01-01T00:00:00.000Z" };
const updatedUser = { ...mockUser, name: "Alice Updated" };

describe("useUpdateName", () => {
  let push: ReturnType<typeof vi.fn>;
  let auth: { user: typeof mockUser | null };

  beforeEach(() => {
    push = vi.fn();
    auth = { user: { ...mockUser } };
    vi.mocked(useRouter).mockReturnValue({ push } as any);
    vi.mocked(useAuthStore).mockReturnValue(auth as any);
    vi.mocked(updateMyName).mockResolvedValue({ data: { user: updatedUser } } as any);
  });

  describe("initial state", () => {
    it("pre-fills name from auth store", () => {
      const { name } = useUpdateName();
      expect(name.value).toBe("Alice");
    });

    it("uses empty string when auth user is null", () => {
      auth.user = null;
      const { name } = useUpdateName();
      expect(name.value).toBe("");
    });
  });

  describe("validation", () => {
    it("sets error when name is empty", async () => {
      const { name, error, submit } = useUpdateName();
      name.value = "";
      await submit();
      expect(error.value).toBe("Name is required");
      expect(updateMyName).not.toHaveBeenCalled();
    });

    it("sets error when name is only whitespace", async () => {
      const { name, error, submit } = useUpdateName();
      name.value = "   ";
      await submit();
      expect(error.value).toBe("Name is required");
      expect(updateMyName).not.toHaveBeenCalled();
    });

    it("clears error when name is valid", async () => {
      const { name, error, submit } = useUpdateName();
      name.value = "Bob";
      await submit();
      expect(error.value).toBeUndefined();
    });
  });

  describe("submit", () => {
    it("calls updateMyName with trimmed name", async () => {
      const { name, submit } = useUpdateName();
      name.value = "  Bob  ";
      await submit();
      expect(updateMyName).toHaveBeenCalledWith("Bob");
    });

    it("updates auth.user on success", async () => {
      const { name, submit } = useUpdateName();
      name.value = "Alice Updated";
      await submit();
      expect(auth.user).toEqual(updatedUser);
    });

    it("navigates to profile on success", async () => {
      const { name, submit } = useUpdateName();
      name.value = "Alice";
      await submit();
      expect(push).toHaveBeenCalledWith({ name: "profile" });
    });

    it("sets serverError from API response on failure", async () => {
      vi.mocked(updateMyName).mockRejectedValue({
        response: { data: { message: "Name too long" } },
      });
      const { name, serverError, submit } = useUpdateName();
      name.value = "Alice";
      await submit();
      expect(serverError.value).toBe("Name too long");
      expect(push).not.toHaveBeenCalled();
    });

    it("falls back to generic message when response has no body", async () => {
      vi.mocked(updateMyName).mockRejectedValue(new Error("Network error"));
      const { name, serverError, submit } = useUpdateName();
      name.value = "Alice";
      await submit();
      expect(serverError.value).toBe("Failed to update name. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { name, loading, submit } = useUpdateName();
      name.value = "Alice";
      await submit();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      vi.mocked(updateMyName).mockRejectedValue(new Error("fail"));
      const { name, loading, submit } = useUpdateName();
      name.value = "Alice";
      await submit();
      expect(loading.value).toBe(false);
    });
  });
});
