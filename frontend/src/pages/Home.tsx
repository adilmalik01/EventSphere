import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { EventCard } from "../components/EventCard";
import type { EventItem } from "../types";

const roles = [
  { title: "Organizers", copy: "Draft a program, submit it for review, then run sessions, booths, and the door." },
  { title: "Exhibitors", copy: "Request a fixed booth size on an approved floor and track the decision." },
  { title: "Attendees", copy: "Buy a pass, save sessions, and carry a ticket code that the door can check." },
  { title: "Admins", copy: "Approve what the public can see, and suspend an account that should not sign in." },
];

export function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    document.title = "EventSphere";
    api.get<{ events: EventItem[] }>("/events").then((response) => setEvents(response.data.events)).catch(() => undefined);
  }, []);

  const next = events.find((event) => new Date(event.endDate) >= new Date());
  const featured = events.slice(0, 3);

  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-end gap-12 px-4 pb-8 pt-14 md:grid-cols-[1.3fr_0.7fr] md:pt-20">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted">Event operations</p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[0.95] md:text-7xl">
            Run the floor. Publish the program.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted">
            EventSphere is where an organizer submits an event, an exhibitor reserves a booth, and a guest leaves with a ticket code.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/events" className="bg-ink px-5 py-3 text-sm text-cream">Browse events</Link>
            <Link to="/register" className="border border-line px-5 py-3 text-sm">Create an account</Link>
          </div>
        </div>
        <aside className="border border-line bg-cream p-6 shadow-card">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Next on the program</p>
          {next ? (
            <>
              <h2 className="mt-3 font-serif text-3xl leading-tight">{next.title}</h2>
              <p className="mt-3 text-sm text-muted">{next.venue}, {next.city}</p>
              <p className="mt-4 text-sm">{next.summary}</p>
              <Link to={`/events/${next._id}`} className="mt-6 inline-block text-sm underline-offset-4 hover:underline">
                View the event
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">The public program will appear here once an event is approved.</p>
          )}
        </aside>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-3 gap-px border border-line bg-line md:grid-cols-3">
        {[
          ["01", "Submit", "Organizers write the event and send it for review."],
          ["02", "Decide", "An admin approves the public record, booths, and passes."],
          ["03", "Arrive", "Guests book, save a session, and check in with a code."],
        ].map(([index, title, copy]) => (
          <div key={title} className="bg-paper px-4 py-6 md:px-6">
            <p className="text-xs text-muted">{index}</p>
            <h2 className="mt-2 font-serif text-2xl">{title}</h2>
            <p className="mt-2 text-sm text-muted">{copy}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-serif text-4xl">On the program</h2>
          <Link to="/events" className="text-sm underline-offset-4 hover:underline">All events</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {featured.map((event, index) => (
            <EventCard key={event._id} event={event} index={index + 1} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-cream">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-4">
          {roles.map((role) => (
            <div key={role.title}>
              <h2 className="font-serif text-2xl">{role.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">{role.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
