import type { Metadata } from "next";

import { AgendaView } from "@/components/events/agenda-view";

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "Calendrier complet des soirées, cours et stages swing à Toulouse.",
};

export default function AgendaPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Agenda swing
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue calendrier par mois ou sur 4 semaines, ou liste chronologique dans le planning.
        </p>
      </div>
      <AgendaView />
    </div>
  );
}
