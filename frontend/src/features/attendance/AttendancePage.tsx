import { Activity, ClipboardList, ScanLine, UserCheck } from "lucide-react";

import { FeaturePreviewPage } from "../../components";

export function AttendancePage() {
  return (
    <FeaturePreviewPage
      eyebrow="Recepción"
      title="Asistencia"
      description="Pantalla demo para check-in y control de asistencia, ideal para explicar cómo Vittra ordena la operación desde recepción hasta la consulta."
      badge="Demo lista para flujo de front desk"
      stats={[
        {
          label: "Check-ins hoy",
          value: "29",
          helper: "Pacientes ya recibidos",
          icon: UserCheck,
          tone: "teal",
        },
        {
          label: "Pendientes",
          value: "08",
          helper: "Turnos aún no confirmados",
          icon: ClipboardList,
          tone: "amber",
        },
        {
          label: "No asistió",
          value: "03",
          helper: "Ausencias del día",
          icon: Activity,
          tone: "rose",
        },
        {
          label: "Check-in express",
          value: "2.1 min",
          helper: "Tiempo operativo estimado",
          icon: ScanLine,
          tone: "sky",
        },
      ]}
      sections={[
        {
          title: "Recepción ordenada",
          description:
            "Sirve para mostrar que la experiencia del paciente también empieza en el front desk.",
          items: [
            "Listado en vivo de turnos con estado de llegada.",
            "Señalización de demoras o ausencias.",
            "Check-in rápido para bajar fricción operativa.",
          ],
        },
        {
          title: "Coordinación interna",
          description:
            "El valor de esta pantalla está en conectar agenda, espera y atención.",
          items: [
            "Vista clara para secretaría y recepción.",
            "Posibilidad de disparar avisos al profesional.",
            "Preparada para integrarse con pantallas de sala de espera.",
          ],
        },
      ]}
      highlights={[
        "Check-in rápido y visual",
        "Estado de turnos en tiempo real",
        "Muy buena pantalla para mostrar flujo completo",
      ]}
    />
  );
}
