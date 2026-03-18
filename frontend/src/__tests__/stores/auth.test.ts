import { setActivePinia, createPinia } from "pinia";
import { useAuthStore } from "../../stores/auth";
import * as authApi from "../../api/auth";
import { getMyProfile } from "../../api/users";
import type { MyUser } from "../../api/users";

vi.mock("../../api/auth", () => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("../../api/users", () => ({
  getMyProfile: vi.fn(),
}));

const mockUser: MyUser = {
  _id: "user-1",
  name: "Test User",
  email: "test@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("auth store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("init", () => {
    it("sets user from getMyProfile response", async () => {
      vi.mocked(getMyProfile).mockResolvedValue({
        data: { user: mockUser, createdEvents: [], participatedEvents: [] },
      } as any);

      const auth = useAuthStore();
      await auth.init();

      expect(auth.user).toEqual(mockUser);
      expect(auth.initialised).toBe(true);
    });

    it("sets user to null when getMyProfile fails", async () => {
      vi.mocked(getMyProfile).mockRejectedValue(new Error("401 Unauthorized"));

      const auth = useAuthStore();
      await auth.init();

      expect(auth.user).toBeNull();
      expect(auth.initialised).toBe(true);
    });

    it("always sets initialised to true even on failure", async () => {
      vi.mocked(getMyProfile).mockRejectedValue(new Error("Network error"));

      const auth = useAuthStore();
      expect(auth.initialised).toBe(false);
      await auth.init();
      expect(auth.initialised).toBe(true);
    });
  });

  describe("login", () => {
    it("sets user from response", async () => {
      vi.mocked(authApi.login).mockResolvedValue({ data: { user: mockUser } } as any);

      const auth = useAuthStore();
      await auth.login({ email: mockUser.email, password: "secret" });

      expect(auth.user).toEqual(mockUser);
    });
  });

  describe("register", () => {
    it("sets user from response", async () => {
      vi.mocked(authApi.register).mockResolvedValue({ data: { user: mockUser } } as any);

      const auth = useAuthStore();
      await auth.register({ name: mockUser.name, email: mockUser.email, password: "secret123" });

      expect(auth.user).toEqual(mockUser);
    });
  });

  describe("logout", () => {
    it("calls logout API and clears user", async () => {
      vi.mocked(authApi.logout).mockResolvedValue({} as any);

      const auth = useAuthStore();
      auth.user = mockUser;
      await auth.logout();

      expect(authApi.logout).toHaveBeenCalled();
      expect(auth.user).toBeNull();
    });
  });
});
