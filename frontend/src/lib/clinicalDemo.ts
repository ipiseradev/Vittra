import type { Appointment, Doctor, Patient } from "../types/domain";

export type OperationalAppointmentStatus =
  | "confirmed"
  | "waiting"
  | "in_consultation"
  | "delayed"
  | "completed"
  | "no_show"
  | "cancelled";

export type ClinicalAlertSeverity = "medium" | "high" | "critical";

export type DiagnosisItem = {
  code: string;
  label: string;
};

export type ClinicalAlert = {
  severity: ClinicalAlertSeverity;
  title: string;
  context: string;
};

export type TimelineEntry = {
  date: string;
  title: string;
  detail: string;
  type: "appointment" | "evolution" | "prescription" | "billing";
};

export type PatientClinicalProfile = {
  activeProblems: string[];
  allergies: string[];
  chronicMedications: string[];
  diagnoses: DiagnosisItem[];
  treatmentPlan: string[];
  timeline: TimelineEntry[];
  alerts: ClinicalAlert[];
  accountBalance: number;
  preferredPaymentMethod: "Tarjeta" | "Transferencia" | "Efectivo";
  insurerPlan: string;
};

const diagnosisCatalog: DiagnosisItem[] = [
  { code: "E11.9", label: "Diabetes mellitus tipo 2 sin complicaciones" },
  { code: "I10", label: "Hipertension esencial primaria" },
  { code: "J45.9", label: "Asma no especificada" },
  { code: "E03.9", label: "Hipotiroidismo no especificado" },
  { code: "G43.9", label: "Migraña no especificada" },
  { code: "M54.5", label: "Lumbalgia" },
];

const allergyCatalog = [
  "Penicilina",
  "Ibuprofeno",
  "Latex",
  "Iodo",
  "Amoxicilina",
  "Clindamicina",
];

const problemCatalog = [
  "Control metabolico pendiente",
  "Seguimiento de tension arterial",
  "Dolor cronico con reagudizaciones",
  "Adherencia irregular al tratamiento",
  "Estudios de laboratorio por revisar",
  "Control preventivo pendiente",
];

const chronicMedicationCatalog = [
  "Metformina 850 mg cada 12 h",
  "Losartan 50 mg cada 24 h",
  "Levotiroxina 75 mcg cada 24 h",
  "Salbutamol a demanda",
  "Rosuvastatina 10 mg nocturna",
  "Omeprazol 20 mg cada 24 h",
];

const treatmentPlanCatalog = [
  "Actualizar evolucion estructurada y signos vitales",
  "Emitir receta digital con duracion y via de administracion",
  "Solicitar laboratorio de control",
  "Confirmar proximo seguimiento en 30 dias",
  "Cerrar cargo administrativo en recepcion",
];

function pickItems<T>(catalog: T[], seed: number, count: number) {
  return Array.from({ length: count }, (_, index) => catalog[(seed + index) % catalog.length]);
}

function daysAgo(value: number) {
  const date = new Date();
  date.setDate(date.getDate() - value);
  return date.toISOString();
}

export function getAppointmentOperationalStatus(
  appointment: Appointment,
  now: Date = new Date()
): OperationalAppointmentStatus {
  if (appointment.status === "completed") {
    return "completed";
  }

  if (appointment.status === "cancelled") {
    return "cancelled";
  }

  if (appointment.status === "no_show") {
    return "no_show";
  }

  const scheduledAt = new Date(appointment.scheduled_at);
  const diffMinutes = Math.round((now.getTime() - scheduledAt.getTime()) / 60000);

  if (diffMinutes >= appointment.duration_minutes + 15) {
    return "delayed";
  }

  if (diffMinutes >= 10) {
    return "in_consultation";
  }

  if (diffMinutes >= -20) {
    return "waiting";
  }

  return "confirmed";
}

export function getOperationalStatusLabel(status: OperationalAppointmentStatus) {
  const labels: Record<OperationalAppointmentStatus, string> = {
    confirmed: "Confirmado",
    waiting: "En espera",
    in_consultation: "En consulta",
    delayed: "Con retraso",
    completed: "Finalizado",
    no_show: "Ausente",
    cancelled: "Cancelado",
  };

  return labels[status];
}

export function getOperationalStatusTone(status: OperationalAppointmentStatus) {
  const tones: Record<OperationalAppointmentStatus, string> = {
    confirmed: "bg-sky-50 text-sky-700",
    waiting: "bg-amber-50 text-amber-700",
    in_consultation: "bg-emerald-50 text-emerald-700",
    delayed: "bg-rose-50 text-rose-700",
    completed: "bg-teal-50 text-teal-700",
    no_show: "bg-slate-200 text-slate-700",
    cancelled: "bg-slate-100 text-slate-600",
  };

  return tones[status];
}

export function buildPatientClinicalProfile(patient: Patient): PatientClinicalProfile {
  const primaryDiagnosis = diagnosisCatalog[patient.id % diagnosisCatalog.length];
  const secondaryDiagnosis = diagnosisCatalog[(patient.id + 2) % diagnosisCatalog.length];
  const isDiabetesPatient = patient.id % 3 === 0;
  const diagnoses = isDiabetesPatient
    ? [diagnosisCatalog[0], secondaryDiagnosis]
    : [primaryDiagnosis, secondaryDiagnosis];

  const allergies = pickItems(allergyCatalog, patient.id, patient.id % 2 === 0 ? 2 : 1);
  const chronicMedications = pickItems(
    chronicMedicationCatalog,
    patient.id + 1,
    patient.id % 2 === 0 ? 3 : 2
  );
  const activeProblems = [
    diagnoses[0].label,
    ...pickItems(problemCatalog, patient.id, 2),
  ];
  const treatmentPlan = pickItems(treatmentPlanCatalog, patient.id, 4);
  const insurerPlan = patient.insurance_provider
    ? `${patient.insurance_provider} ${patient.insurance_id ?? "Plan Oro"}`
    : patient.id % 2 === 0
      ? "Particular"
      : "Prepaga Plus";

  const alerts: ClinicalAlert[] = [
    {
      severity: "critical",
      title: `Alergia activa: ${allergies[0]}`,
      context: "Visible en consulta, receta y check-in.",
    },
    {
      severity: isDiabetesPatient ? "high" : "medium",
      title: isDiabetesPatient
        ? "Paciente cronico con seguimiento metabolico"
        : "Requiere seguimiento clinico coordinado",
      context: isDiabetesPatient
        ? "Ultimo control con laboratorio pendiente de revision."
        : "Se recomienda revisar adherencia y proximo turno.",
    },
  ];

  if (patient.id % 4 === 0) {
    alerts.push({
      severity: "high",
      title: "Interaccion potencial en tratamiento cronico",
      context: "Validar antes de renovar medicacion o emitir nueva receta.",
    });
  }

  const timeline: TimelineEntry[] = [
    {
      date: daysAgo(2),
      title: "Evolucion ambulatoria firmada",
      detail: "Control de seguimiento con ajustes en plan terapeutico.",
      type: "evolution",
    },
    {
      date: daysAgo(6),
      title: "Receta emitida",
      detail: `Renovacion de ${chronicMedications[0]}.`,
      type: "prescription",
    },
    {
      date: daysAgo(14),
      title: "Consulta clinica",
      detail: `Diagnosticos asociados: ${diagnoses.map((item) => item.code).join(", ")}.`,
      type: "appointment",
    },
    {
      date: daysAgo(18),
      title: "Pago pendiente",
      detail: "Saldo abierto del ultimo episodio ambulatorio.",
      type: "billing",
    },
  ];

  return {
    activeProblems,
    allergies,
    chronicMedications,
    diagnoses,
    treatmentPlan,
    timeline,
    alerts,
    accountBalance: 18000 + (patient.id % 5) * 6500,
    preferredPaymentMethod: (["Tarjeta", "Transferencia", "Efectivo"] as const)[
      patient.id % 3
    ],
    insurerPlan,
  };
}

export function getAgeLabel(dateOfBirth?: string | null) {
  if (!dateOfBirth) {
    return "Edad no registrada";
  }

  const birthDate = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }

  return `${age} anos`;
}

export function getPatientDisplayDocument(patient: Patient) {
  return patient.document_id || `HC-${String(patient.id).padStart(5, "0")}`;
}

export function buildAppointmentCharge(appointment: Appointment) {
  const baseAmountByType: Record<Appointment["appointment_type"], number> = {
    consultation: 42000,
    follow_up: 30000,
    procedure: 65000,
    checkup: 27000,
  };

  return baseAmountByType[appointment.appointment_type] + (appointment.id % 3) * 3500;
}

export function groupRevenueByDoctor(
  appointments: Appointment[],
  doctors: Doctor[]
): Array<{ doctorName: string; revenue: number; completed: number }> {
  return doctors
    .map((doctor) => {
      const doctorAppointments = appointments.filter(
        (appointment) => appointment.doctor_id === doctor.id
      );
      const completedAppointments = doctorAppointments.filter(
        (appointment) => appointment.status === "completed"
      );

      return {
        doctorName: doctor.full_name,
        revenue: completedAppointments.reduce(
          (total, appointment) => total + buildAppointmentCharge(appointment),
          0
        ),
        completed: completedAppointments.length,
      };
    })
    .filter((item) => item.completed > 0)
    .sort((left, right) => right.revenue - left.revenue);
}

export function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}
