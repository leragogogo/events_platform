import { computed, ref } from "vue";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/auth";
import {
  initiateConnection,
  updateConnectionStatus,
  removeConnection,
  getMyConnections,
  type Connection,
} from "../api/connections";

export type RelationshipStatus = "none" | "pending_sent" | "pending_received" | "approved";

export function useConnection(targetUserId: string) {
  const auth = useAuthStore();
  const queryClient = useQueryClient();
  const loading = ref(false);
  const error = ref("");

  const { data: connectionsData, isLoading: connectionsLoading } = useQuery({
    queryKey: ["my-connections"],
    queryFn: () => getMyConnections().then((r) => r.data.connections),
  });

  const connection = computed<Connection | null>(
    () => connectionsData.value?.find(
      (c) => c.requesterId._id === targetUserId || c.addresseeId._id === targetUserId
    ) ?? null
  );

  const status = computed<RelationshipStatus>(() => {
    const c = connection.value;
    if (!c) return "none";
    if (c.status === "approved") return "approved";
    if (c.status === "declined") return "none";
    return c.requesterId._id === auth.user?._id ? "pending_sent" : "pending_received";
  });

  async function connect() {
    loading.value = true;
    error.value = "";
    try {
      await initiateConnection(targetUserId);
      queryClient.invalidateQueries({ queryKey: ["my-connections"] });
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to send connection request.";
    } finally {
      loading.value = false;
    }
  }

  async function approve() {
    if (!connection.value) return;
    loading.value = true;
    error.value = "";
    try {
      await updateConnectionStatus(connection.value._id, "approved");
      queryClient.invalidateQueries({ queryKey: ["my-connections"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", targetUserId] });
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to approve connection.";
    } finally {
      loading.value = false;
    }
  }

  async function decline() {
    if (!connection.value) return;
    loading.value = true;
    error.value = "";
    try {
      await updateConnectionStatus(connection.value._id, "declined");
      queryClient.invalidateQueries({ queryKey: ["my-connections"] });
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to decline connection.";
    } finally {
      loading.value = false;
    }
  }

  async function remove() {
    if (!connection.value) return;
    loading.value = true;
    error.value = "";
    try {
      await removeConnection(connection.value._id);
      queryClient.invalidateQueries({ queryKey: ["my-connections"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile", targetUserId] });
    } catch (err: any) {
      error.value = err?.response?.data?.message ?? "Failed to remove connection.";
    } finally {
      loading.value = false;
    }
  }

  return { status, connection, connectionsLoading, loading, error, connect, approve, decline, remove };
}
