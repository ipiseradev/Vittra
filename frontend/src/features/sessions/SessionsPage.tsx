import { useEffect, useState } from "react";

import { trainityApi } from "../../api/trainityApi";
import type { ClassSession } from "../../types/domain";

export function SessionsPage() {
  const [sessions, setSessions] = useState<ClassSession[]>([]);

  useEffect(() => {
    trainityApi.getSessions().then(setSessions).catch(() => setSessions([]));
  }, []);

  return (
    <section className="rounded-lg border bg-white p-4">
      <h1 className="mb-4 text-lg font-semibold">Class Sessions</h1>
      <ul className="space-y-2">
        {sessions.map((session) => (
          <li key={session.id} className="rounded border p-3 text-sm">
            <p className="font-medium">{session.title}</p>
            <p className="text-slate-600">
              Coach {session.coach_name} - Capacity {session.capacity}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
