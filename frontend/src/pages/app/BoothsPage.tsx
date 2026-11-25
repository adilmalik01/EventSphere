import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button, Field, PageHeader, StatusBadge, inputClass } from "../../components/ui";
import type { BoothItem, EventItem } from "../../types";

export function BoothsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [booths, setBooths] = useState<BoothItem[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<EventItem[]>([]);

  function load() {
    api.get<{ booths: BoothItem[]; prices: Record<string, number> }>("/booths").then((response) => {
      setBooths(response.data.booths);
      setPrices(response.data.prices);
    }).catch((error) => toast(error instanceof Error ? error.message : "Could not load booths.", "bad"));
  }

  useEffect(() => {
    document.title = "Booths · EventSphere";
    load();
    if (user?.role === "exhibitor") {
      api.get<{ events: EventItem[] }>("/events").then((response) => {
        setEvents(response.data.events.filter((event) => event.status === "approved"));
      }).catch(() => undefined);
    }
  }, [user?.role]);

  async function request(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    try {
      await api.post("/booths", {
        eventId: data.get("eventId"),
        size: data.get("size"),
        company: data.get("company"),
        pitch: data.get("pitch"),
      });
      formEvent.currentTarget.reset();
      toast("Request sent to the organizer.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not send the request.", "bad");
    }
  }

  async function decide(id: string, status: "approved" | "rejected") {
    const note = window.prompt(status === "approved" ? "Note for the exhibitor (optional)" : "Reason (optional)") || "";
    try {
      await api.patch(`/booths/${id}/status`, { status, note });
      toast(status === "approved" ? "Booth approved." : "Request declined.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update.", "bad");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Floor"
        title="Booths"
        body="Sizes are fixed: 3×3, 3×6, and 6×6. The price is set by the platform, not typed by the exhibitor."
      />
      {user?.role === "exhibitor" ? (
        <form onSubmit={request} className="mb-8 grid gap-3 border border-line bg-cream p-4 md:grid-cols-2">
          <Field label="Event">
            <select className={inputClass} name="eventId" required>
              <option value="">Choose an approved event</option>
              {events.map((event) => <option key={event._id} value={event._id}>{event.title}</option>)}
            </select>
          </Field>
          <Field label="Size">
            <select className={inputClass} name="size" required defaultValue="3x3">
              {Object.entries(prices).map(([size, price]) => (
                <option key={size} value={size}>{size} · {money(price)}</option>
              ))}
            </select>
          </Field>
          <Field label="Company"><input className={inputClass} name="company" defaultValue={user.company} required /></Field>
          <Field label="What you will show"><textarea className={inputClass} name="pitch" /></Field>
          <Button type="submit">Request booth</Button>
        </form>
      ) : null}
      <div className="space-y-3">
        {booths.map((booth) => (
          <article key={booth._id} className="border border-line bg-cream p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">{booth.company}</h2>
                  <StatusBadge status={booth.status} />
                </div>
                <p className="text-sm text-muted">{booth.event?.title} · {booth.size} · {money(booth.price)}</p>
                {booth.pitch ? <p className="mt-2 text-sm">{booth.pitch}</p> : null}
                {booth.note ? <p className="mt-1 text-sm text-muted">{booth.note}</p> : null}
                {booth.exhibitor ? <p className="mt-1 text-xs text-muted">{booth.exhibitor.name} · {booth.exhibitor.email}</p> : null}
              </div>
              {user?.role !== "exhibitor" && booth.status === "requested" ? (
                <div className="flex gap-2">
                  <Button onClick={() => decide(booth._id, "approved")}>Approve</Button>
                  <Button variant="ghost" onClick={() => decide(booth._id, "rejected")}>Decline</Button>
                </div>
              ) : null}
            </div>
          </article>
        ))}
        {booths.length === 0 ? <p className="text-sm text-muted">No booth requests yet.</p> : null}
      </div>
    </div>
  );
}
