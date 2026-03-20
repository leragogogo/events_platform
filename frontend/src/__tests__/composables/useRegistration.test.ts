import { useRegistration } from "../../composables/useRegistration";
import { useQueryClient } from "@tanstack/vue-query";
import { createRegistration, cancelRegistration } from "../../api/registrations";

vi.mock("@tanstack/vue-query", () => ({ useQueryClient: vi.fn() }));
vi.mock("../../api/registrations", () => ({
  createRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
}));

const EVENT_ID = "event-abc";

const mockRegistration = {
  _id: "reg-1",
  userId: "user-1",
  eventId: EVENT_ID,
  createdAt: "2024-01-01T00:00:00.000Z",
};

describe("useRegistration", () => {
  let getQueryData: ReturnType<typeof vi.fn>;
  let setQueryData: ReturnType<typeof vi.fn>;
  let removeQueries: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getQueryData = vi.fn().mockReturnValue(null);
    setQueryData = vi.fn();
    removeQueries = vi.fn();
    vi.mocked(useQueryClient).mockReturnValue({ getQueryData, setQueryData, removeQueries } as any);
    vi.mocked(createRegistration).mockResolvedValue({ data: { registration: mockRegistration } } as any);
    vi.mocked(cancelRegistration).mockResolvedValue({} as any);
  });

  describe("initial state", () => {
    it("isRegistered is false when cache is empty", () => {
      const { isRegistered } = useRegistration(EVENT_ID);
      expect(isRegistered.value).toBe(false);
    });

    it("isRegistered is true when cache has a registration", () => {
      getQueryData.mockReturnValue(mockRegistration);
      const { isRegistered } = useRegistration(EVENT_ID);
      expect(isRegistered.value).toBe(true);
    });
  });

  describe("register", () => {
    it("calls createRegistration with the event id", async () => {
      const { register } = useRegistration(EVENT_ID);
      await register();
      expect(createRegistration).toHaveBeenCalledWith(EVENT_ID);
    });

    it("sets isRegistered to true on success", async () => {
      const { isRegistered, register } = useRegistration(EVENT_ID);
      await register();
      expect(isRegistered.value).toBe(true);
    });

    it("stores registration in the query cache on success", async () => {
      const { register } = useRegistration(EVENT_ID);
      await register();
      expect(setQueryData).toHaveBeenCalledWith(
        ["registration", EVENT_ID],
        mockRegistration
      );
    });

    it("sets error from API response on failure", async () => {
      vi.mocked(createRegistration).mockRejectedValue({
        response: { data: { message: "Event is full" } },
      });
      const { error, register } = useRegistration(EVENT_ID);
      await register();
      expect(error.value).toBe("Event is full");
    });

    it("falls back to generic message when response has no body", async () => {
      vi.mocked(createRegistration).mockRejectedValue(new Error("Network error"));
      const { error, register } = useRegistration(EVENT_ID);
      await register();
      expect(error.value).toBe("Failed to register. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { loading, register } = useRegistration(EVENT_ID);
      await register();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      vi.mocked(createRegistration).mockRejectedValue(new Error("fail"));
      const { loading, register } = useRegistration(EVENT_ID);
      await register();
      expect(loading.value).toBe(false);
    });
  });

  describe("cancel", () => {
    function setupRegistered() {
      getQueryData.mockReturnValue(mockRegistration);
      return useRegistration(EVENT_ID);
    }

    it("calls cancelRegistration with the registration id", async () => {
      const { cancel } = setupRegistered();
      await cancel();
      expect(cancelRegistration).toHaveBeenCalledWith(mockRegistration._id);
    });

    it("sets isRegistered to false on success", async () => {
      const { isRegistered, cancel } = setupRegistered();
      await cancel();
      expect(isRegistered.value).toBe(false);
    });

    it("removes registration from the query cache on success", async () => {
      const { cancel } = setupRegistered();
      await cancel();
      expect(removeQueries).toHaveBeenCalledWith({
        queryKey: ["registration", EVENT_ID],
      });
    });

    it("does not call cancelRegistration when not registered", async () => {
      const { cancel } = useRegistration(EVENT_ID);
      await cancel();
      expect(cancelRegistration).not.toHaveBeenCalled();
    });

    it("sets error from API response on failure", async () => {
      vi.mocked(cancelRegistration).mockRejectedValue({
        response: { data: { message: "Registration not found" } },
      });
      const { error, cancel } = setupRegistered();
      await cancel();
      expect(error.value).toBe("Registration not found");
    });

    it("falls back to generic message when response has no body", async () => {
      vi.mocked(cancelRegistration).mockRejectedValue(new Error("Network error"));
      const { error, cancel } = setupRegistered();
      await cancel();
      expect(error.value).toBe("Failed to cancel registration. Please try again.");
    });

    it("resets loading to false after success", async () => {
      const { loading, cancel } = setupRegistered();
      await cancel();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      vi.mocked(cancelRegistration).mockRejectedValue(new Error("fail"));
      const { loading, cancel } = setupRegistered();
      await cancel();
      expect(loading.value).toBe(false);
    });
  });
});
