import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import { ErrorAlert } from "../../components";
import { storage } from "../../lib/storage";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@clinic.com");
  const [password, setPassword] = useState("123456");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const token = await trainityApi.login(email.trim(), password);
      storage.setToken(token.access_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo iniciar sesión. Verificá las credenciales."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,108,148,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(15,157,138,0.16),transparent_24%)]" />

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card hidden overflow-hidden p-10 lg:block">
          <div className="flex h-full flex-col justify-between">
            <div>
              <span className="pill bg-sky-100 text-sky-800">Vittra Demo</span>
              <h1 className="mt-6 max-w-lg text-5xl font-bold tracking-tight text-slate-950">
                Un front clínico que ya se deja mostrar.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
                Dashboard ejecutivo, agenda médica, pacientes y módulos de negocio
                con una identidad visual consistente para demo comercial o post de
                producto.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["UX coherente", "Navegación, estados vacíos y paneles alineados."],
                ["Carga rápida", "Rutas lazy y estructura preparada para crecer."],
                ["Storytelling", "Pantallas diseñadas para video y screenshots."],
              ].map(([title, description]) => (
                <div key={title} className="surface-muted p-4">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="surface-card p-6 sm:p-8 lg:p-10">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-lg font-bold text-sky-800">
              V
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                Workspace
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Iniciar sesión
              </h2>
            </div>
          </div>

          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
            <div>
              <p className="text-sm font-semibold text-teal-900">
                Demo preconfigurada
              </p>
              <p className="mt-1 text-sm text-teal-700">
                Podés entrar directamente con el usuario demo cargado en el
                formulario.
              </p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {error ? <ErrorAlert message={error} /> : null}

            <div>
              <label htmlFor="email" className="field-label">
                Email profesional
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-field"
                placeholder="tu-clinica@vittra.app"
                disabled={loading}
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="field-label mb-0">
                  Contraseña
                </label>
                <span className="text-sm font-medium text-sky-700">
                  Acceso seguro
                </span>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-field pr-12"
                  placeholder="Ingresá tu contraseña"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {loading ? "Ingresando..." : "Entrar al workspace"}
            </button>
          </form>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Usuario demo
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">admin@clinic.com</p>
            </div>
            <div className="surface-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Contraseña
              </p>
              <p className="mt-2 text-sm font-medium text-slate-900">123456</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
