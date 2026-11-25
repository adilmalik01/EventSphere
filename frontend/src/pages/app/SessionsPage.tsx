import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toInputDate, when } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import { Button, Field, PageHeader, inputClass } from "../../components/ui";
import type { EventItem, SessionItem } from "../../types";

export function SessionsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventId, setEventId] = useState("");
  const [sessions, setSessions] = useState<SessionItem[]>([]);

  useEffect(() => {
    document.title = "Sessions · EventSphere";
    api.get<{ events: EventItem[] }>("/events?scope=mine").then((response) => {
      setEvents(response.data.events);
      if (response.data.events[0]) setEventId(response.data.events[0]._id);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!eventId) return;
    api.get<{ sessions: SessionItem[] }>(`/sessions?event=${eventId}`).then((response) => setSessions(response.data.sessions)).catch((error) => {
      toast(error instanceof Error ? error.message : "Could not load sessions.", "bad");
    });
  }, [eventId]);

  async function create(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const data = new FormData(formEvent.currentTarget);
    try {
      await api.post("/sessions", {
        eventId,
        title: data.get("title"),
        speaker: data.get("speaker"),
        hall: data.get("hall"),
        description: data.get("description"),
        startTime: data.get("startTime"),
        endTime: data.get("endTime"),
        capacity: Number(data.get("capacity")),
      });
      formEvent.currentTarget.reset();
      toast("Session added.");
      const response = await api.get<{ sessions: SessionItem[] }>(`/sessions?event=${eventId}`);
      setSessions(response.data.sessions);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not add the session.", "bad");
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/sessions/${id}`);
      setSessions((current) => current.filter((session) => session._id !== id));
      toast("Session removed.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not remove.", "bad");
    }
  }

  const selected = events.find((event) => event._id === eventId);

  return (
    <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <PageHeader eyebrow="Program" title="Sessions" body="A session has to sit inside the event's start and end." />
        <Field label="Event">
          <select className={inputClass} value={eventId} onChange={(event) => setEventId(event.target.value)}>
            {events.map((event) => <option key={event._id} value={event._id}>{event.title}</option>)}
          </select>
        </Field>
        {selected ? <p className="mt-2 text-xs text-muted">{when(selected.startDate, true)} – {when(selected.endDate, true)}</p> : null}
        <form onSubmit={create} className="mt-5 space-y-3">
          <Field label="Title"><input className={inputClass} name="title" required /></Field>
          <Field label="Speaker"><input className={inputClass} name="speaker" required /></Field>
          <div className="grid gap-3 md:grid-cols-2">
            <Field label="Hall"><input className={inputClass} name="hall" required /></Field>
            <Field label="Capacity"><input className={inputClass} name="capacity" type="number" min={1} required defaultValue={40} /></Field>
            <Field label="Starts"><input className={inputClass} name="startTime" type="datetime-local" required defaultValue={toInputDate(selected?.startDate)} /></Field>
            <Field label="Ends"><input className={inputClass} name="endTime" type="datetime-local" required defaultValue={toInputDate(selected?.endDate)} /></Field>
          </div>
          <Field label="Note"><textarea className={inputClass} name="description" /></Field>
          <Button type="submit">Add session</Button>
        </form>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => (
          <article key={session._id} className="border border-line bg-cream p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{session.title}</h2>
                <p className="text-sm text-muted">{session.speaker} · {session.hall}</p>
                <p className="text-sm">{when(session.startTime, true)} · {session.registered}/{session.capacity}</p>
              </div>
              <Button variant="ghost" onClick={() => remove(session._id)}>Remove</Button>
            </div>
          </article>
        ))}
        {eventId && sessions.length === 0 ? <p className="text-sm text-muted">No sessions on this event yet.</p> : null}
      </div>
    </div>
  );
}
