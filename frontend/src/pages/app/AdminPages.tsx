import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { when } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import { Button, Field, PageHeader, StatusBadge, inputClass } from "../../components/ui";
import type { Category, EventItem, ReviewItem, User } from "../../types";

export function ApprovalsPage() {
  const toast = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);

  function load() {
    api.get<{ events: EventItem[] }>("/events?scope=all").then((response) => {
      setEvents(response.data.events.filter((event) => event.status === "pending"));
    }).catch((error) => toast(error instanceof Error ? error.message : "Could not load the queue.", "bad"));
  }

  useEffect(() => {
    document.title = "Approvals · EventSphere";
    load();
  }, []);

  async function decide(id: string, status: "approved" | "rejected") {
    const note = window.prompt(status === "approved" ? "Note to the organizer (optional)" : "What needs to change?") || "";
    try {
      await api.patch(`/events/${id}/status`, { status, note });
      toast(status === "approved" ? "Event is on the public program." : "Sent back to the organizer.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update.", "bad");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Approvals" body="Only pending events are listed. Approved events stay on the public program." />
      <div className="space-y-4">
        {events.map((event) => (
          <article key={event._id} className="border border-line bg-cream p-4">
            <h2 className="font-serif text-2xl">{event.title}</h2>
            <p className="text-sm text-muted">{event.city} · {event.venue} · {when(event.startDate, true)}</p>
            <p className="mt-2 max-w-2xl text-sm">{event.summary}</p>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => decide(event._id, "approved")}>Approve</Button>
              <Button variant="ghost" onClick={() => decide(event._id, "rejected")}>Reject</Button>
            </div>
          </article>
        ))}
        {events.length === 0 ? <p className="text-sm text-muted">The queue is clear.</p> : null}
      </div>
    </div>
  );
}

export function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);

  function load() {
    api.get<{ users: User[] }>("/users").then((response) => setUsers(response.data.users)).catch((error) => {
      toast(error instanceof Error ? error.message : "Could not load people.", "bad");
    });
  }

  useEffect(() => {
    document.title = "People · EventSphere";
    load();
  }, []);

  async function setStatus(user: User) {
    const status = user.status === "active" ? "suspended" : "active";
    try {
      await api.patch(`/users/${user._id}`, { status });
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update.", "bad");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="People" body="Suspending an account blocks the next sign-in. You cannot suspend yourself." />
      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[640px] bg-cream text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Name</th>
              <th className="px-3 py-3 font-medium">Email</th>
              <th className="px-3 py-3 font-medium">Role</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((person) => (
              <tr key={person._id} className="border-b border-line">
                <td className="px-3 py-3">{person.name}</td>
                <td className="px-3 py-3">{person.email}</td>
                <td className="px-3 py-3 capitalize">{person.role}</td>
                <td className="px-3 py-3"><StatusBadge status={person.status} /></td>
                <td className="px-3 py-3 text-right">
                  {person.role === "admin" ? null : (
                    <button type="button" className="underline-offset-4 hover:underline" onClick={() => setStatus(person)}>
                      {person.status === "active" ? "Suspend" : "Restore"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = useState<Category[]>([]);

  function load() {
    api.get<{ categories: Category[] }>("/categories").then((response) => setCategories(response.data.categories)).catch(() => undefined);
  }

  useEffect(() => {
    document.title = "Categories · EventSphere";
    load();
  }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await api.post("/categories", { name: data.get("name"), description: data.get("description") });
      event.currentTarget.reset();
      toast("Category added.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not add.", "bad");
    }
  }

  async function remove(id: string) {
    try {
      await api.delete(`/categories/${id}`);
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not delete.", "bad");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Categories" body="A category that is already used by an event cannot be deleted." />
      <form onSubmit={create} className="mb-6 grid gap-3 border border-line bg-cream p-4 md:grid-cols-[1fr_1fr_auto]">
        <Field label="Name"><input className={inputClass} name="name" required /></Field>
        <Field label="Description"><input className={inputClass} name="description" /></Field>
        <Button type="submit" className="self-end">Add</Button>
      </form>
      <ul className="space-y-2">
        {categories.map((category) => (
          <li key={category._id} className="flex items-center justify-between gap-3 border border-line bg-cream px-4 py-3">
            <span><strong>{category.name}</strong> <span className="text-sm text-muted">{category.description}</span></span>
            <button type="button" className="text-sm underline-offset-4 hover:underline" onClick={() => remove(category._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);

  useEffect(() => {
    document.title = "Reviews · EventSphere";
    api.get<{ reviews: ReviewItem[] }>("/reviews").then((response) => setReviews(response.data.reviews)).catch(() => undefined);
  }, []);

  async function remove(id: string) {
    try {
      await api.delete(`/reviews/${id}`);
      setReviews((current) => current.filter((review) => review._id !== id));
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not delete.", "bad");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Admin" title="Reviews" body="Remove a review that does not belong on the public event." />
      <div className="space-y-3">
        {reviews.map((review) => (
          <article key={review._id} className="border border-line bg-cream p-4">
            <p className="text-sm text-muted">{review.event?.title} · {review.user?.name} · {review.rating}/5</p>
            <p className="mt-1">{review.comment}</p>
            <button type="button" className="mt-2 text-sm underline-offset-4 hover:underline" onClick={() => remove(review._id)}>Delete</button>
          </article>
        ))}
      </div>
    </div>
  );
}
