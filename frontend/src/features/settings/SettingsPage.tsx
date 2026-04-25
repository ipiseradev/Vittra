import { FormEvent, useState } from "react";
import { BellRing, Building2, Save, ShieldCheck, Sparkles } from "lucide-react";

import { MetricCard, PageHeader, SuccessAlert } from "../../components";

type SettingsState = {
  clinicName: string;
  specialty: string;
  email: string;
  phone: string;
  notifications: boolean;
  aiAssistant: boolean;
};

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    clinicName: "Vittra Clinic",
    specialty: "Clínica general y atención integral",
    email: "admin@clinic.com",
    phone: "+54 11 5555 0101",
    notifications: true,
    aiAssistant: true,
  });
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="page-shell">
      <PageHeader
        eyebrow="Configuración"
        title="Ajustes de la clínica"
        description="Una pantalla demo para mostrar personalización de marca, automatizaciones y gobierno del espacio de trabajo."
        actions={
          <button type="submit" form="settings-form" className="btn-primary">
            <Save className="h-4 w-4" />
            Guardar cambios
          </button>
        }
      />

      {saved ? <SuccessAlert message="Configuración guardada para la demo." /> : null}

      <section className="dashboard-grid">
        <MetricCard
          label="Branding"
          value="100%"
          helper="Identidad alineada a Vittra"
          icon={Building2}
          tone="sky"
        />
        <MetricCard
          label="Automatizaciones"
          value="06"
          helper="Flujos listos para crecer"
          icon={Sparkles}
          tone="teal"
        />
        <MetricCard
          label="Notificaciones"
          value={settings.notifications ? "Activas" : "Pausadas"}
          helper="Mensajería interna y operativa"
          icon={BellRing}
          tone="amber"
        />
        <MetricCard
          label="Seguridad"
          value="Alta"
          helper="Controles y permisos visibles"
          icon={ShieldCheck}
          tone="violet"
        />
      </section>

      <form id="settings-form" onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card p-6 sm:p-7">
          <h2 className="section-title">Perfil institucional</h2>
          <p className="section-copy">
            Campos pensados para que la demo muestre personalización real desde el
            día uno.
          </p>
          <div className="mt-6 grid gap-5">
            <div>
              <label className="field-label" htmlFor="clinic_name">
                Nombre de la clínica
              </label>
              <input
                id="clinic_name"
                className="input-field"
                value={settings.clinicName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    clinicName: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label className="field-label" htmlFor="specialty">
                Especialidad principal
              </label>
              <input
                id="specialty"
                className="input-field"
                value={settings.specialty}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    specialty: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="settings_email">
                  Email administrativo
                </label>
                <input
                  id="settings_email"
                  className="input-field"
                  type="email"
                  value={settings.email}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </div>
              <div>
                <label className="field-label" htmlFor="settings_phone">
                  Teléfono
                </label>
                <input
                  id="settings_phone"
                  className="input-field"
                  value={settings.phone}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Automatizaciones</h2>
            <p className="section-copy">
              Toggles simples para comunicar que Vittra puede crecer hacia una
              operación más inteligente.
            </p>
            <div className="mt-6 space-y-4">
              <label className="surface-muted flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Notificaciones activas</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Recordatorios y avisos operativos de la clínica.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      notifications: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
                />
              </label>

              <label className="surface-muted flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="font-semibold text-slate-900">Asistente IA disponible</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Habilita la experiencia conversacional para contexto clínico.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.aiAssistant}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      aiAssistant: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-200"
                />
              </label>
            </div>
          </div>

          <div className="surface-card p-6 sm:p-7">
            <h2 className="section-title">Narrativa para demo</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Branding editable para diferentes clínicas o especialidades.</li>
              <li>Controles visibles para automatizaciones y gobierno del workspace.</li>
              <li>Base lista para evolucionar a permisos, sedes y roles avanzados.</li>
            </ul>
          </div>
        </section>
      </form>
    </div>
  );
}
