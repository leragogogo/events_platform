import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { updateEvent } from "../api/events";
import { useEventForm } from "./useEventForm";

export function useEditEvent(id: string) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useEventForm();
  const serverError = ref("");
  const isPending = ref(false);

  async function submit() {
    serverError.value = "";
    if (form.needsGeocode.value) await form.handleAddressBlur();
    if (!form.validate()) return;

    isPending.value = true;
    try {
      await updateEvent(id, form.toPayload());
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push({ name: "event-detail", params: { id } });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Failed to update event. Please try again.";
    } finally {
      isPending.value = false;
    }
  }

  return { ...form, serverError, isPending, submit };
}
