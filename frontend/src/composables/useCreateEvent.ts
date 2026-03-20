import { ref } from "vue";
import { useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { createEvent } from "../api/events";
import { useEventForm } from "./useEventForm";

export function useCreateEvent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useEventForm();
  const serverError = ref("");
  const isPending = ref(false);

  async function submit() {
    serverError.value = "";
    if (!form.validate()) return;

    isPending.value = true;
    try {
      const res = await createEvent(form.toPayload());
      queryClient.invalidateQueries({ queryKey: ["events"] });
      router.push({ name: "event-detail", params: { id: res.data.event._id } });
    } catch (err: any) {
      serverError.value = err?.response?.data?.message ?? "Failed to create event. Please try again.";
    } finally {
      isPending.value = false;
    }
  }

  return { ...form, serverError, isPending, submit };
}
