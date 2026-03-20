import { ref } from "vue";
import { useConnection } from "../../composables/useConnection";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "../../stores/auth";
import {
  initiateConnection,
  updateConnectionStatus,
  removeConnection,
} from "../../api/connections";
import type { Connection } from "../../api/connections";

vi.mock("@tanstack/vue-query", () => ({ useQuery: vi.fn(), useQueryClient: vi.fn() }));
vi.mock("../../stores/auth", () => ({ useAuthStore: vi.fn() }));
vi.mock("../../api/connections", () => ({
  initiateConnection: vi.fn(),
  updateConnectionStatus: vi.fn(),
  removeConnection: vi.fn(),
  getMyConnections: vi.fn(),
}));

const MY_ID = "user-me";
const TARGET_ID = "user-target";
const CONN_ID = "conn-1";

const APPROVED: Connection = {
  _id: CONN_ID,
  requesterId: { _id: MY_ID, name: "Me" },
  addresseeId: { _id: TARGET_ID, name: "Target" },
  status: "approved",
  createdAt: "2024-01-01T00:00:00.000Z",
};

const PENDING_SENT: Connection = { ...APPROVED, status: "pending" };

const PENDING_RECEIVED: Connection = {
  ...APPROVED,
  requesterId: { _id: TARGET_ID, name: "Target" },
  addresseeId: { _id: MY_ID, name: "Me" },
  status: "pending",
};

const DECLINED: Connection = { ...APPROVED, status: "declined" };

let invalidateQueries: ReturnType<typeof vi.fn>;

function setup(connections: Connection[] = []) {
  invalidateQueries = vi.fn();
  vi.mocked(useAuthStore).mockReturnValue({ user: { _id: MY_ID } } as any);
  vi.mocked(useQueryClient).mockReturnValue({ invalidateQueries } as any);
  vi.mocked(useQuery).mockReturnValue({ data: ref(connections), isLoading: ref(false) } as any);
  return useConnection(TARGET_ID);
}

describe("useConnection", () => {
  describe("status", () => {
    it("returns 'none' when no connection exists", () => {
      const { status } = setup([]);
      expect(status.value).toBe("none");
    });

    it("returns 'pending_sent' when current user is the requester", () => {
      const { status } = setup([PENDING_SENT]);
      expect(status.value).toBe("pending_sent");
    });

    it("returns 'pending_received' when current user is the addressee", () => {
      const { status } = setup([PENDING_RECEIVED]);
      expect(status.value).toBe("pending_received");
    });

    it("returns 'approved' when connection is approved", () => {
      const { status } = setup([APPROVED]);
      expect(status.value).toBe("approved");
    });

    it("returns 'none' for a declined connection", () => {
      const { status } = setup([DECLINED]);
      expect(status.value).toBe("none");
    });
  });

  describe("connect", () => {
    it("calls initiateConnection with the target user id", async () => {
      vi.mocked(initiateConnection).mockResolvedValue({} as any);
      const { connect } = setup([]);
      await connect();
      expect(initiateConnection).toHaveBeenCalledWith(TARGET_ID);
    });

    it("invalidates my-connections query on success", async () => {
      vi.mocked(initiateConnection).mockResolvedValue({} as any);
      const { connect } = setup([]);
      await connect();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["my-connections"] });
    });

    it("sets error from API response on failure", async () => {
      vi.mocked(initiateConnection).mockRejectedValue({
        response: { data: { message: "Already connected" } },
      });
      const { connect, error } = setup([]);
      await connect();
      expect(error.value).toBe("Already connected");
    });

    it("falls back to generic error message", async () => {
      vi.mocked(initiateConnection).mockRejectedValue(new Error("Network error"));
      const { connect, error } = setup([]);
      await connect();
      expect(error.value).toBe("Failed to send connection request.");
    });

    it("resets loading to false after success", async () => {
      vi.mocked(initiateConnection).mockResolvedValue({} as any);
      const { connect, loading } = setup([]);
      await connect();
      expect(loading.value).toBe(false);
    });

    it("resets loading to false after failure", async () => {
      vi.mocked(initiateConnection).mockRejectedValue(new Error("fail"));
      const { connect, loading } = setup([]);
      await connect();
      expect(loading.value).toBe(false);
    });
  });

  describe("approve", () => {
    it("calls updateConnectionStatus with approved", async () => {
      vi.mocked(updateConnectionStatus).mockResolvedValue({} as any);
      const { approve } = setup([PENDING_RECEIVED]);
      await approve();
      expect(updateConnectionStatus).toHaveBeenCalledWith(CONN_ID, "approved");
    });

    it("invalidates my-connections and user-profile queries on success", async () => {
      vi.mocked(updateConnectionStatus).mockResolvedValue({} as any);
      const { approve } = setup([PENDING_RECEIVED]);
      await approve();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["my-connections"] });
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["user-profile", TARGET_ID] });
    });

    it("sets error on failure", async () => {
      vi.mocked(updateConnectionStatus).mockRejectedValue(new Error("fail"));
      const { approve, error } = setup([PENDING_RECEIVED]);
      await approve();
      expect(error.value).toBe("Failed to approve connection.");
    });
  });

  describe("decline", () => {
    it("calls updateConnectionStatus with declined", async () => {
      vi.mocked(updateConnectionStatus).mockResolvedValue({} as any);
      const { decline } = setup([PENDING_RECEIVED]);
      await decline();
      expect(updateConnectionStatus).toHaveBeenCalledWith(CONN_ID, "declined");
    });

    it("invalidates my-connections query on success", async () => {
      vi.mocked(updateConnectionStatus).mockResolvedValue({} as any);
      const { decline } = setup([PENDING_RECEIVED]);
      await decline();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["my-connections"] });
    });
  });

  describe("remove", () => {
    it("calls removeConnection with the connection id", async () => {
      vi.mocked(removeConnection).mockResolvedValue({} as any);
      const { remove } = setup([APPROVED]);
      await remove();
      expect(removeConnection).toHaveBeenCalledWith(CONN_ID);
    });

    it("invalidates my-connections and user-profile queries on success", async () => {
      vi.mocked(removeConnection).mockResolvedValue({} as any);
      const { remove } = setup([APPROVED]);
      await remove();
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["my-connections"] });
      expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["user-profile", TARGET_ID] });
    });

    it("sets error on failure", async () => {
      vi.mocked(removeConnection).mockRejectedValue(new Error("fail"));
      const { remove, error } = setup([APPROVED]);
      await remove();
      expect(error.value).toBe("Failed to remove connection.");
    });
  });
});
