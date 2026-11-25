import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorText, Field, inputClass } from "../components/ui";

const demos = [
  ["Admin", "admin@eventsphere.com", "Admin@123"],
  ["Organizer", "organizer@eventsphere.com", "Organizer@123"],
  ["Exhibitor", "exhibitor@eventsphere.com", "Exhibitor@123"],
  ["Attendee", "attendee@eventsphere.com", "Attendee@123"],
];

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Sign in · EventSphere";
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Sign in</p>
        <h1 className="mt-3 font-serif text-5xl">Welcome back.</h1>
        <p className="mt-4 max-w-md text-sm text-muted">Use a demo account for the viva, or the email you registered with.</p>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          {demos.map(([label, demoEmail, demoPassword]) => (
            <button
              key={label}
              type="button"
              className="border border-line bg-cream px-3 py-3 text-left text-sm hover:border-ink"
              onClick={() => {
                setEmail(demoEmail);
                setPassword(demoPassword);
              }}
            >
              <span className="block text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
              {demoEmail}
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={onSubmit} className="border border-line bg-cream p-6 shadow-card">
        <div className="space-y-4">
          <Field label="Email">
            <input className={inputClass} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          {error ? <ErrorText>{error}</ErrorText> : null}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
        </div>
        <p className="mt-4 text-sm text-muted">
          New here? <Link to="/register" className="text-ink underline-offset-4 hover:underline">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
