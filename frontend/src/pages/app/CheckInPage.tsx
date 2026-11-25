import { FormEvent, useState } from "react";
import { api } from "../../lib/api";
import { when } from "../../lib/format";
import { Button, ErrorText, Field, PageHeader, inputClass } from "../../components/ui";
import type { BookingItem } from "../../types";

export function CheckInPage() {
  const [code, setCode] = useState("");
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setBooking(null);
    try {
      const response = await api.post<{ booking: BookingItem }>("/checkin", { ticketCode: code });
      setBooking(response.data.booking);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Check-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader eyebrow="Door" title="Check-in" body="Type the code printed on the pass. Organizers can only check in their own events." />
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Ticket code">
          <input className={inputClass} value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ES-XXXX-XXXX" required />
        </Field>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" disabled={busy}>{busy ? "Checking…" : "Check in"}</Button>
      </form>
      {booking ? (
        <article className="mt-6 border border-ink bg-cream p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-pine">Checked in {when(booking.checkedInAt, true)}</p>
          <h2 className="mt-2 font-serif text-3xl">{booking.user?.name}</h2>
          <p className="text-sm">{booking.event?.title}</p>
          <p className="text-sm text-muted">{booking.ticketType?.name} × {booking.quantity}</p>
          <p className="mt-2 font-serif tracking-wide">{booking.ticketCode}</p>
        </article>
      ) : null}
    </div>
  );
}
