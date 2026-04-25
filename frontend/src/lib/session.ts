import { storage } from "./storage";

export type SessionUser = {
  name: string;
  role: string;
  initials: string;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return atob(padded);
}

function buildInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0])
    .join("")
    .toUpperCase();
}

export function getSessionUser(): SessionUser {
  const token = storage.getToken();

  if (!token) {
    return {
      name: "Equipo Vittra",
      role: "admin",
      initials: "VT",
    };
  }

  try {
    const payload = JSON.parse(decodeBase64Url(token.split(".")[1]));
    const name = payload.name || payload.full_name || payload.sub || "Equipo Vittra";
    const role = payload.role || "admin";

    return {
      name,
      role,
      initials: buildInitials(name),
    };
  } catch {
    return {
      name: "Equipo Vittra",
      role: "admin",
      initials: "VT",
    };
  }
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    admin: "Administrador",
    doctor: "Médico",
    nurse: "Enfermería",
    receptionist: "Recepción",
    patient: "Paciente",
    user: "Usuario",
  };

  return labels[role] ?? "Equipo";
}
