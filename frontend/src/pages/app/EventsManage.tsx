import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { money, toInputDate, when } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import { Button, Empty, ErrorText, Field, PageHeader, StatusBadge, inputClass } from "../../components/ui";
import type { Category, EventItem, Ticket, Tone } from "../../types";

const tones: Tone[] = ["clay", "pine", "ink", "gold", "dusk"];

type DraftTicket = { _id?: string; name: string; price: number; quantity: number; sold?: number };

const blank = {
  title: "",
  summary: "",
  description: "",
  category: "",
  city: "Karachi",
  venue: "",
  startDate: "",
  endDate: "",
  capacity: 200,
  tone: "clay" as Tone,
  highlights: "",
  publish: true,
};

export function EventsManage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const toast = useToast();

  function load() {
    api.get<{ events: EventItem[] }>("/events?scope=mine").then((response) => setEvents(response.data.events)).catch((error) => {
      toast(error instanceof Error ? error.message : "Could not load events.", "bad");
    });
  }

  useEffect(() => {
    document.title = "My events · EventSphere";
    load();
  }, []);

  async function remove(id: string) {
    if (!window.confirm("Delete this unpublished event?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast("Event deleted.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not delete.", "bad");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Organizer"
        title="Events"
        body="Drafts stay private. Submitted events wait for an admin before they appear on the public program."
        action={<Link to="/app/events/new" className="bg-ink px-4 py-2.5 text-sm text-cream">New event</Link>}
      />
      {events.length === 0 ? <Empty title="No events yet" body="Create the first one and send it for review." /> : null}
      <div className="space-y-3">
        {events.map((event) => (
          <article key={event._id} className="flex flex-wrap items-center justify-between gap-4 border border-line bg-cream p-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-2xl">{event.title}</h2>
                <StatusBadge status={event.status} />
              </div>
              <p className="text-sm text-muted">{event.city} · {when(event.startDate)} · {event.sold || 0} sold</p>
              {event.reviewNote ? <p className="mt-1 text-sm text-clay">{event.reviewNote}</p> : null}
            </div>
            <div className="flex gap-2">
              {event.status === "approved" || event.status === "completed" ? (
                <Link to={`/events/${event._id}`} className="border border-line px-3 py-2 text-sm">View</Link>
              ) : null}
              {event.status !== "completed" ? <Link to={`/app/events/${event._id}/edit`} className="border border-line px-3 py-2 text-sm">Edit</Link> : null}
              {event.status === "draft" || event.status === "pending" || event.status === "rejected" ? (
                <Button variant="ghost" onClick={() => remove(event._id)}>Delete</Button>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function EventEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(blank);
  const [tickets, setTickets] = useState<DraftTicket[]>([{ name: "General", price: 1500, quantity: 100 }]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = id ? "Edit event · EventSphere" : "New event · EventSphere";
    api.get<{ categories: Category[] }>("/categories").then((response) => {
      setCategories(response.data.categories);
      if (!id && response.data.categories[0]) {
        setForm((current) => ({ ...current, category: current.category || response.data.categories[0]._id }));
      }
    }).catch(() => undefined);
    if (!id) return;
    api.get<{ event: EventItem }>(`/events/${id}`).then((response) => {
      const event = response.data.event;
      setForm({
        title: event.title,
        summary: event.summary,
        description: event.description,
        category: typeof event.category === "string" ? event.category : event.category._id,
        city: event.city,
        venue: event.venue,
        startDate: toInputDate(event.startDate),
        endDate: toInputDate(event.endDate),
        capacity: event.capacity,
        tone: event.tone,
        highlights: event.highlights.join("\n"),
        publish: event.status !== "draft",
      });
      setTickets((event.tickets || []).map((ticket: Ticket) => ({ ...ticket })));
    }).catch((err) => setError(err instanceof Error ? err.message : "Could not open this event."));
  }, [id]);

  function updateTicket(index: number, patch: Partial<DraftTicket>) {
    setTickets((current) => current.map((ticket, item) => (item === index ? { ...ticket, ...patch } : ticket)));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      ...form,
      highlights: form.highlights.split("\n").map((line) => line.trim()).filter(Boolean),
      tickets: tickets.map(({ _id, name, price, quantity }) => ({ _id, name, price: Number(price), quantity: Number(quantity) })),
      removeTicketIds: removed,
    };
    try {
      if (id) await api.put(`/events/${id}`, payload);
      else await api.post("/events", payload);
      toast(form.publish ? "Sent for review." : "Draft saved.");
      navigate("/app/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-5">
      <PageHeader eyebrow="Organizer" title={id ? "Edit event" : "New event"} body="A published event stays off the public site until an admin approves it." />
      <Field label="Title"><input className={inputClass} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
      <Field label="Summary"><input className={inputClass} required maxLength={200} value={form.summary} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></Field>
      <Field label="Description"><textarea className={`${inputClass} min-h-32`} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Category">
          <select className={inputClass} required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
            <option value="">Choose</option>
            {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="City"><input className={inputClass} required value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></Field>
        <Field label="Venue"><input className={inputClass} required value={form.venue} onChange={(event) => setForm({ ...form, venue: event.target.value })} /></Field>
        <Field label="Capacity"><input className={inputClass} type="number" min={1} required value={form.capacity} onChange={(event) => setForm({ ...form, capacity: Number(event.target.value) })} /></Field>
        <Field label="Starts"><input className={inputClass} type="datetime-local" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></Field>
        <Field label="Ends"><input className={inputClass} type="datetime-local" required value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></Field>
      </div>
      <Field label="Cover tone">
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <button key={tone} type="button" className={`tone-${tone} h-10 w-16 border ${form.tone === tone ? "border-ink" : "border-transparent"}`} aria-label={tone} onClick={() => setForm({ ...form, tone })} />
          ))}
        </div>
      </Field>
      <Field label="Highlights" hint="One per line, up to six.">
        <textarea className={inputClass} value={form.highlights} onChange={(event) => setForm({ ...form, highlights: event.target.value })} />
      </Field>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl">Tickets</h2>
          <Button type="button" variant="ghost" onClick={() => setTickets((current) => [...current, { name: "", price: 0, quantity: 50 }])}>Add pass</Button>
        </div>
        {tickets.map((ticket, index) => (
          <div key={ticket._id || index} className="grid gap-2 border border-line p-3 md:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
            <input className={inputClass} placeholder="Name" value={ticket.name} onChange={(event) => updateTicket(index, { name: event.target.value })} aria-label="Ticket name" />
            <input className={inputClass} type="number" min={0} value={ticket.price} onChange={(event) => updateTicket(index, { price: Number(event.target.value) })} aria-label="Price" />
            <input className={inputClass} type="number" min={1} value={ticket.quantity} onChange={(event) => updateTicket(index, { quantity: Number(event.target.value) })} aria-label="Quantity" />
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (ticket._id) setRemoved((current) => [...current, ticket._id as string]);
                setTickets((current) => current.filter((_, item) => item !== index));
              }}
            >
              Remove
            </Button>
            {ticket.sold ? <p className="text-xs text-muted md:col-span-4">{ticket.sold} already sold · {money(ticket.price)}</p> : null}
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.publish} onChange={(event) => setForm({ ...form, publish: event.target.checked })} />
        Submit for approval. Leave unchecked to keep a private draft.
      </label>
      {error ? <ErrorText>{error}</ErrorText> : null}
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save event"}</Button>
    </form>
  );
}
