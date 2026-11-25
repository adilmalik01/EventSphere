import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, ErrorText, Field, inputClass } from "../components/ui";
import type { Role } from "../types";

const roles: { id: Exclude<Role, "admin">; title: string; copy: string }[] = [
  { id: "attendee", title: "Attendee", copy: "Book tickets and save sessions." },
  { id: "organizer", title: "Organizer", copy: "Submit events and run the door." },
  { id: "exhibitor", title: "Exhibitor", copy: "Request a booth on an approved floor." },
];

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Exclude<Role, "admin">>("attendee");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Create account · EventSphere";
    if (user) navigate("/app", { replace: true });
  }, [user, navigate]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    try {
      await register({
        name: String(data.get("name") || ""),
        email: String(data.get("email") || ""),
        password: String(data.get("password") || ""),
        phone: String(data.get("phone") || ""),
        company: String(data.get("company") || ""),
        role,
      });
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Create account</p>
      <h1 className="mt-3 font-serif text-5xl">Choose a side of the floor.</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-5 border border-line bg-cream p-6 shadow-card">
        <div className="grid gap-3 md:grid-cols-3">
          {roles.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`border px-3 py-3 text-left ${role === item.id ? "border-ink bg-paper" : "border-line"}`}
              aria-pressed={role === item.id}
            >
              <span className="block font-medium">{item.title}</span>
              <span className="mt-1 block text-xs text-muted">{item.copy}</span>
            </button>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name"><input className={inputClass} name="name" required minLength={2} /></Field>
          <Field label="Email"><input className={inputClass} name="email" type="email" required autoComplete="email" /></Field>
          <Field label="Password" hint="At least 6 characters, with a letter and a number.">
            <input className={inputClass} name="password" type="password" required minLength={6} autoComplete="new-password" />
          </Field>
          <Field label="Phone"><input className={inputClass} name="phone" /></Field>
          <Field label="Company"><input className={inputClass} name="company" /></Field>
        </div>
        {error ? <ErrorText>{error}</ErrorText> : null}
        <Button type="submit" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
        <p className="text-sm text-muted">
          Already registered? <Link to="/login" className="text-ink underline-offset-4 hover:underline">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
