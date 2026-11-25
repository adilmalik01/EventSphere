import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { when } from "../../lib/format";
import { useToast } from "../../context/ToastContext";
import { Button, Empty, PageHeader } from "../../components/ui";
import type { AgendaItem } from "../../types";

export function AgendaPage() {
  const toast = useToast();
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);

  function load() {
    api.get<{ agenda: AgendaItem[] }>("/agenda").then((response) => setAgenda(response.data.agenda)).catch((error) => {
      toast(error instanceof Error ? error.message : "Could not load the agenda.", "bad");
    });
  }

  useEffect(() => {
    document.title = "Agenda · EventSphere";
    load();
  }, []);

  async function leave(id: string) {
    try {
      await api.delete(`/sessions/${id}/register`);
      toast("Removed from your agenda.");
      load();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not leave.", "bad");
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Attendee" title="Agenda" body="Sessions you saved after booking a ticket." />
      {agenda.length === 0 ? <Empty title="Nothing saved" body="Open an event you have a ticket for and save a session." /> : null}
      <div className="space-y-3">
        {agenda.map((item) => item.session ? (
          <article key={item._id} className="flex flex-wrap items-center justify-between gap-3 border border-line bg-cream p-4">
            <div>
              <h2 className="font-medium">{item.session.title}</h2>
              <p className="text-sm text-muted">{item.session.speaker} · {item.session.hall}</p>
              <p className="text-sm text-muted">{when(item.session.startTime, true)} · {item.session.event?.title}</p>
            </div>
            <div className="flex gap-2">
              {item.session.event?._id ? <Link to={`/events/${item.session.event._id}`} className="border border-line px-3 py-2 text-sm">Event</Link> : null}
              <Button variant="ghost" onClick={() => leave(item.session?._id || "")}>Leave</Button>
            </div>
          </article>
        ) : null)}
      </div>
    </div>
  );
}
