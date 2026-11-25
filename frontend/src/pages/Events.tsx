import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EventCard } from "../components/EventCard";
import { inputClass } from "../components/ui";
import type { Category, EventItem } from "../types";

export function Events() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Events · EventSphere";
    api.get<{ categories: Category[]; cities: string[] }>("/events/facets").then((response) => {
      setCategories(response.data.categories);
      setCities(response.data.cities);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    api
      .get<{ events: EventItem[] }>(`/events?${params.toString()}`)
      .then((response) => setEvents(response.data.events))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [q, category, city]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Public program</p>
      <h1 className="mt-2 font-serif text-5xl">Events</h1>
      <div className="mt-8 grid gap-3 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <input className={inputClass} placeholder="Search title, city, or venue" value={q} onChange={(event) => setQ(event.target.value)} aria-label="Search events" />
        <select className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item._id} value={item._id}>{item.name}</option>
          ))}
        </select>
        <select className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} aria-label="City">
          <option value="">All cities</option>
          {cities.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
      {loading ? <p className="mt-10 text-sm text-muted">Loading the program…</p> : null}
      {!loading && events.length === 0 ? <p className="mt-10 text-sm text-muted">Nothing matches that filter.</p> : null}
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {events.map((event, index) => (
          <EventCard key={event._id} event={event} index={index + 1} />
        ))}
      </div>
    </div>
  );
}
