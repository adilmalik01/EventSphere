import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { money, when } from "../../lib/format";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button, Empty, PageHeader, StatusBadge } from "../../components/ui";
import type { BookingItem } from "../../types";

export function BookingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [bookings, setBookings] = useState<BookingItem[]>([]);

  function load() {
    api.get<{ bookings: BookingItem[] }>("/bookings").then((response) => setBookings(response.data.bookings)).catch((error) => {
      toast(error instanceof Error ? error.message : "Could not load bookings.", "bad");
    });
  }

  useEffect(() => {
    document.title = "Bookings · EventSphere";
    load();
  }, []);

  async function cancel(id: string) {
    try {
      await api.patch(`/bookings/${id}/cancel`);
      toast("Booking cancelled.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not cancel.", "bad");
    }
  }

  const own = user?.role === "attendee" || user?.role === "exhibitor";

  return (
    <div>
      <PageHeader eyebrow="Tickets" title="Bookings" body={own ? "Each confirmed pass has a code for the door." : "Bookings across the events you can see."} />
      {bookings.length === 0 ? <Empty title="No bookings" body="Tickets you buy, or sales on your events, will collect here." /> : null}
      <div className="space-y-4">
        {bookings.map((booking) => {
          const upcoming = booking.event?.startDate ? new Date(booking.event.startDate) > new Date() : false;
          return (
            <article key={booking._id} className="grid gap-4 border border-line bg-cream p-4 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl">{booking.event?.title}</h2>
                  <StatusBadge status={booking.status} />
                  {booking.checkedIn ? <span className="bg-pine px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-cream">Checked in</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {booking.ticketType?.name} × {booking.quantity} · {money(booking.amount)} · {booking.paymentMethod === "card" ? "Demo card" : "Counter"}
                </p>
                <p className="text-sm text-muted">{when(booking.event?.startDate, true)} · {booking.event?.city}</p>
                {!own && booking.user ? <p className="mt-2 text-sm">{booking.user.name} · {booking.user.email}</p> : null}
                <p className="mt-3 font-serif text-xl tracking-wide">{booking.ticketCode}</p>
                {booking.checkedIn ? <p className="text-xs text-muted">Checked in {when(booking.checkedInAt, true)}</p> : null}
              </div>
              {own && booking.qr && booking.status === "confirmed" ? <img src={booking.qr} alt="" className="h-28 w-28" /> : null}
              {own && booking.status === "confirmed" && upcoming && !booking.checkedIn ? (
                <Button variant="ghost" onClick={() => cancel(booking._id)}>Cancel</Button>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
