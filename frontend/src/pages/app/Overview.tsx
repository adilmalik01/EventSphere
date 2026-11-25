import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { when } from "../../lib/format";
import { PageHeader } from "../../components/ui";
import type { DashboardPayload, EventItem } from "../../types";

export function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);

  useEffect(() => {
    document.title = "Overview · EventSphere";
    api.get<DashboardPayload>("/dashboard").then((response) => setData(response.data)).catch(() => undefined);
  }, []);

  if (!user || !data) return <p className="text-sm text-muted">Loading your desk…</p>;
  const max = Math.max(1, ...(data.series || []).map((item) => item.value));

  return (
    <div>
      <PageHeader eyebrow={user.role} title={`Hello, ${user.name.split(" ")[0]}`} body="A live view of the work attached to this account." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.cards.map((card) => (
          <article key={card.label} className="border border-line bg-cream p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{card.label}</p>
            <p className="mt-2 font-serif text-3xl">{card.value}</p>
            {card.note ? <p className="mt-1 text-xs text-muted">{card.note}</p> : null}
          </article>
        ))}
      </div>

      {data.queue ? (
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {data.queue.map((item) => (
            <Link key={item.href} to={item.href} className="border border-line bg-cream p-5 hover:border-ink">
              <p className="font-serif text-4xl">{item.count}</p>
              <p className="mt-1 text-sm">{item.label}</p>
            </Link>
          ))}
        </div>
      ) : null}

      {data.series && data.series.length ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Events by category</h2>
          <ul className="mt-4 space-y-3">
            {data.series.map((item) => (
              <li key={item.label}>
                <div className="mb-1 flex justify-between text-sm"><span>{item.label}</span><span>{item.value}</span></div>
                <div className="h-2 bg-line"><div className="h-2 bg-ink" style={{ width: `${(item.value / max) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.upcoming && data.upcoming.length ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Coming up</h2>
          <ul className="mt-4 divide-y divide-line border border-line bg-cream">
            {data.upcoming.map((event) => (
              <li key={(event as EventItem)._id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span>{event.title}</span>
                <span className="text-muted">{event.city} · {when(event.startDate)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.recentBookings && data.recentBookings.length ? (
        <section className="mt-10">
          <h2 className="font-serif text-2xl">Recent bookings</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {data.recentBookings.map((booking) => (
              <li key={booking._id} className="flex justify-between gap-3 border border-line bg-cream px-4 py-3">
                <span>{booking.user?.name} · {booking.event?.title}</span>
                <span className="text-muted">{booking.quantity} tickets</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
