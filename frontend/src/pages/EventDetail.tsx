import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { categoryName, isPast, money, organizerName, when } from "../lib/format";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button, ErrorText, Stars, StatusBadge, inputClass } from "../components/ui";
import type { BookingItem, BoothItem, EventItem, ReviewItem, SessionItem } from "../types";

type Detail = {
  event: EventItem;
  sessions: SessionItem[];
  reviews: ReviewItem[];
  booths: BoothItem[];
  rating: number;
  canReview: boolean;
  hasTicket: boolean;
};

export function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<"card" | "counter">("card");
  const [busy, setBusy] = useState(false);
  const [pass, setPass] = useState<BookingItem | null>(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);

  function load() {
    return api.get<Detail>(`/events/${id}`).then((response) => {
      setDetail(response.data);
      const first = response.data.event.tickets?.find((ticket) => ticket.quantity - ticket.sold > 0);
      if (first?._id) setTicketId(first._id);
      document.title = `${response.data.event.title} · EventSphere`;
    });
  }

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Event unavailable."));
  }, [id, user?._id]);

  if (error) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><ErrorText>{error}</ErrorText></div>;
  }
  if (!detail) return <div className="mx-auto max-w-3xl px-4 py-16 text-sm text-muted">Loading the event…</div>;

  const { event, sessions, reviews, booths } = detail;
  const selected = event.tickets?.find((ticket) => ticket._id === ticketId);
  const remaining = selected ? selected.quantity - selected.sold : 0;
  const bookable = event.status === "approved" && !isPast(event.endDate);

  async function book(formEvent: FormEvent) {
    formEvent.preventDefault();
    setBusy(true);
    try {
      const response = await api.post<{ booking: BookingItem }>("/bookings", {
        eventId: event._id,
        ticketTypeId: ticketId,
        quantity,
        paymentMethod: method,
      });
      setPass(response.data.booking);
      toast("Ticket confirmed.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Booking failed.", "bad");
    } finally {
      setBusy(false);
    }
  }

  async function join(sessionId: string) {
    try {
      await api.post(`/sessions/${sessionId}/register`);
      toast("Added to your agenda.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not join.", "bad");
    }
  }

  async function review(formEvent: FormEvent) {
    formEvent.preventDefault();
    try {
      await api.post(`/events/${event._id}/reviews`, { rating, comment });
      setComment("");
      toast("Review posted.");
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not post the review.", "bad");
    }
  }

  return (
    <div>
      <header className={`tone-${event.tone}`}>
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-16">
          <p className="text-xs uppercase tracking-[0.18em] text-white/75">{categoryName(event)} · {event.city}</p>
          <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-tight md:text-6xl">{event.title}</h1>
          <p className="mt-4 max-w-2xl text-white/85">{event.summary}</p>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1.35fr_0.75fr]">
        <div>
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span>{when(event.startDate, true)} – {when(event.endDate, true)}</span>
            <span>{event.venue}</span>
            <span>{organizerName(event)}</span>
            <StatusBadge status={isPast(event.endDate) && event.status === "approved" ? "completed" : event.status} />
          </div>
          <p className="mt-6 max-w-2xl leading-7">{event.description}</p>
          {event.highlights.length ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {event.highlights.map((item) => (
                <li key={item} className="border border-line px-3 py-1 text-sm">{item}</li>
              ))}
            </ul>
          ) : null}

          <section className="mt-12">
            <h2 className="font-serif text-3xl">Sessions</h2>
            <div className="mt-4 space-y-3">
              {sessions.length === 0 ? <p className="text-sm text-muted">The program has not been posted yet.</p> : null}
              {sessions.map((session) => (
                <article key={session._id} className="border border-line bg-cream p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{session.title}</h3>
                      <p className="text-sm text-muted">{session.speaker} · {session.hall}</p>
                      <p className="mt-1 text-sm">{when(session.startTime, true)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{session.registered}/{session.capacity}</p>
                      {user && detail.hasTicket ? (
                        <button type="button" className="mt-2 underline-offset-4 hover:underline" onClick={() => join(session._id)}>
                          Save seat
                        </button>
                      ) : null}
                    </div>
                  </div>
                  {session.description ? <p className="mt-2 text-sm text-muted">{session.description}</p> : null}
                </article>
              ))}
            </div>
          </section>

          {booths.length ? (
            <section className="mt-12">
              <h2 className="font-serif text-3xl">On the floor</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {booths.map((booth) => (
                  <li key={booth._id} className="border border-line p-4">
                    <p className="font-medium">{booth.company}</p>
                    <p className="text-sm text-muted">{booth.size} booth</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-12">
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-3xl">Reviews</h2>
              {reviews.length ? <Stars value={detail.rating} /> : null}
            </div>
            <div className="mt-4 space-y-4">
              {reviews.map((review) => (
                <article key={review._id}>
                  <Stars value={review.rating} />
                  <p className="mt-1">{review.comment}</p>
                  <p className="text-xs text-muted">{review.user?.name} · {when(review.createdAt)}</p>
                </article>
              ))}
              {reviews.length === 0 ? <p className="text-sm text-muted">No reviews yet.</p> : null}
            </div>
            {detail.canReview ? (
              <form onSubmit={review} className="mt-6 space-y-3 border border-line bg-cream p-4">
                <label className="block text-sm">
                  Rating
                  <select className={`${inputClass} mt-1`} value={rating} onChange={(event) => setRating(Number(event.target.value))}>
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </label>
                <textarea className={inputClass} required minLength={4} placeholder="What should the next guest know?" value={comment} onChange={(event) => setComment(event.target.value)} />
                <Button type="submit">Post review</Button>
              </form>
            ) : null}
          </section>
        </div>

        <aside className="h-fit border border-line bg-cream p-5 shadow-card lg:sticky lg:top-24">
          <h2 className="font-serif text-3xl">Tickets</h2>
          {!bookable ? <p className="mt-3 text-sm text-muted">Booking is closed for this event.</p> : null}
          {pass ? (
            <div className="mt-4 border border-ink p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Your pass</p>
              <p className="mt-2 font-serif text-2xl tracking-wide">{pass.ticketCode}</p>
              {pass.qr ? <img src={pass.qr} alt="" className="mt-3 h-36 w-36" /> : null}
              <p className="mt-2 text-sm">Show this code at the door. Reference {pass.paymentReference}.</p>
            </div>
          ) : null}
          {bookable ? (
            <form onSubmit={book} className="mt-4 space-y-4">
              <div className="space-y-2">
                {event.tickets?.map((ticket) => {
                  const left = ticket.quantity - ticket.sold;
                  return (
                    <label key={ticket._id} className={`block border px-3 py-3 ${ticketId === ticket._id ? "border-ink" : "border-line"}`}>
                      <span className="flex items-center justify-between gap-3">
                        <span>
                          <input type="radio" name="ticket" className="mr-2" checked={ticketId === ticket._id} disabled={left < 1} onChange={() => ticket._id && setTicketId(ticket._id)} />
                          {ticket.name}
                        </span>
                        <span>{money(ticket.price)}</span>
                      </span>
                      <span className="mt-1 block text-xs text-muted">{left} left</span>
                    </label>
                  );
                })}
              </div>
              <label className="block text-sm">
                Quantity
                <input className={`${inputClass} mt-1`} type="number" min={1} max={Math.min(10, remaining || 1)} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
              </label>
              <fieldset>
                <legend className="text-sm">Payment</legend>
                <label className="mt-2 block text-sm"><input type="radio" name="pay" checked={method === "card"} onChange={() => setMethod("card")} className="mr-2" />Demo card — no charge, no card number</label>
                <label className="mt-1 block text-sm"><input type="radio" name="pay" checked={method === "counter"} onChange={() => setMethod("counter")} className="mr-2" />Pay at the counter</label>
              </fieldset>
              <p className="text-sm">Total {money((selected?.price || 0) * quantity)}</p>
              {user ? (
                <Button type="submit" disabled={busy || !ticketId || remaining < 1} className="w-full">{busy ? "Confirming…" : "Confirm booking"}</Button>
              ) : (
                <Link to="/login" state={{ from: `/events/${event._id}` }} className="block bg-ink px-4 py-2.5 text-center text-sm text-cream">Sign in to book</Link>
              )}
            </form>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
