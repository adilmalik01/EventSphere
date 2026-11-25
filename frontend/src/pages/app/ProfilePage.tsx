import { FormEvent, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button, Field, PageHeader, inputClass } from "../../components/ui";
import type { User } from "../../types";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      const response = await api.put<{ user: User }>("/auth/profile", {
        name: data.get("name"),
        phone: data.get("phone"),
        company: data.get("company"),
        bio: data.get("bio"),
        currentPassword: data.get("currentPassword"),
        nextPassword: data.get("nextPassword"),
      });
      setUser(response.data.user);
      toast("Profile saved.");
      const current = event.currentTarget.elements.namedItem("currentPassword");
      const next = event.currentTarget.elements.namedItem("nextPassword");
      if (current instanceof HTMLInputElement) current.value = "";
      if (next instanceof HTMLInputElement) next.value = "";
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not save.", "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <PageHeader eyebrow="Account" title="Profile" body={`${user.email} · ${user.role}`} />
      <Field label="Name"><input className={inputClass} name="name" defaultValue={user.name} required /></Field>
      <Field label="Phone"><input className={inputClass} name="phone" defaultValue={user.phone} /></Field>
      <Field label="Company"><input className={inputClass} name="company" defaultValue={user.company} /></Field>
      <Field label="Bio"><textarea className={inputClass} name="bio" defaultValue={user.bio} maxLength={400} /></Field>
      <Field label="Current password" hint="Required only when you set a new password.">
        <input className={inputClass} name="currentPassword" type="password" autoComplete="current-password" />
      </Field>
      <Field label="New password"><input className={inputClass} name="nextPassword" type="password" autoComplete="new-password" /></Field>
      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}
