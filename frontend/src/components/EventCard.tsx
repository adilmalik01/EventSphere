import { Link } from "react-router-dom";
import type { EventItem } from "../types";
import { categoryName, money, when } from "../lib/format";

export function EventCard({ event, index = 1 }: { event: EventItem; index?: number }) {
  return (
    <article className="group flex h-full flex-col border border-line bg-cream shadow-card transition hover:-translate-y-0.5">
      <Link to={`/events/${event._id}`} className={`tone-${event.tone} block h-40`}>
        <span className="relative z-10 flex h-full flex-col justify-between p-4">
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/80">{categoryName(event)}</span>
          <span className="font-serif text-5xl text-white/25">{String(index).padStart(2, "0")}</span>
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">
          {event.city} · {when(event.startDate)}
        </p>
        <h3 className="mt-2 font-serif text-[1.7rem] leading-tight">
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h3>
        <p className="mt-2 flex-1 text-sm text-muted">{event.summary}</p>
        <div className="mt-5 flex items-center justify-between text-sm">
          <span>{event.priceFrom ? `From ${money(event.priceFrom)}` : "Tickets closed"}</span>
          <Link to={`/events/${event._id}`} className="underline-offset-4 hover:underline">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}
