import { useEffect, useState } from "react";

import { trainityApi } from "../../api/trainityApi";
import type { Reservation } from "../../types/domain";

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    trainityApi.getReservations().then(setReservations).catch(() => setReservations([]));
  }, []);

  return (
    <section className="rounded-lg border bg-white p-4">
      <h1 className="mb-4 text-lg font-semibold">Reservations</h1>
      <ul className="space-y-2">
        {reservations.map((reservation) => (
          <li key={reservation.id} className="rounded border p-3 text-sm">
            Client #{reservation.client_id} - Session #{reservation.class_session_id} - {reservation.status}
          </li>
        ))}
      </ul>
    </section>
  );
}
