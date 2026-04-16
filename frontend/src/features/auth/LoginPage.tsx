import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader, Eye, EyeOff } from "lucide-react";

import { trainityApi } from "../../api/trainityApi";
import { storage } from "../../lib/storage";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Nuevo estado para el "ojito"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const token = await trainityApi.login(email.trim(), password);
      storage.setToken(token.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError("Credenciales inválidas. Verifica email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Vittra Clinic</h1>
          <p className="mt-2 text-sm text-slate-600">Inicia sesión en tu clínica</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              disabled={loading}
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Contraseña
              </label>
              {/* Enlace de recuperación de contraseña */}
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
            {/* Contenedor relativo para posicionar el ícono del ojito */}
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"} // Cambia el tipo dinámicamente
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                disabled={loading}
                required
              />
              {/* Botón del ojito posicionado absolutamente dentro del input */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff size={18} className="transition-colors" />
                ) : (
                  <Eye size={18} className="transition-colors" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors font-medium flex items-center justify-center gap-2"
          >
            {loading && <Loader size={18} className="animate-spin" />}
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Demo: usa email <span className="font-medium text-slate-900">admin@clinic.com</span> y contraseña <span className="font-medium text-slate-900">123456</span>
        </p>
      </div>
    </div>
  );
}