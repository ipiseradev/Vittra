import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { trainityApi } from "../../api/trainityApi";
import { storage } from "../../lib/storage";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@trainity.local");
  const [password, setPassword] = useState("changeme");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const token = await trainityApi.login(email, password);
      storage.setToken(token.access_token);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-lg border bg-white p-6">
        <h1 className="text-xl font-semibold">Trainity Login</h1>
        <input
          className="w-full rounded border p-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-slate-900 p-2 text-white" type="submit">
          Sign in
        </button>
      </form>
    </div>
  );
}
