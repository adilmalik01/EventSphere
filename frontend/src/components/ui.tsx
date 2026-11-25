import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { EventStatus } from "../types";

export const inputClass =
  "w-full border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-ink";

const buttonStyles = {
  primary: "bg-ink text-cream hover:bg-clay",
  ghost: "border border-line bg-cream text-ink hover:border-ink",
  danger: "bg-clay text-white hover:bg-[#8d3120]",
  quiet: "bg-transparent text-ink underline-offset-4 hover:underline",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

const statusCopy: Record<EventStatus, string> = {
  draft: "Draft",
  pending: "In review",
  approved: "Approved",
  rejected: "Rejected",
  completed: "Completed",
};

export function StatusBadge({ status }: { status: EventStatus | string }) {
  const known = status as EventStatus;
  const label = statusCopy[known] || status;
  const tone =
    status === "approved"
      ? "bg-pine text-cream"
      : status === "pending" || status === "requested"
        ? "bg-[#f3e6cf] text-gold"
        : status === "rejected" || status === "cancelled" || status === "suspended"
          ? "bg-[#f8e6e1] text-clay"
          : "bg-line text-ink";
  return <span className={`inline-flex px-2 py-1 text-[11px] uppercase tracking-[0.14em] ${tone}`}>{label}</span>;
}

export function Stars({ value }: { value: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span aria-label={`${value} out of 5`} className="text-clay">
      {"★".repeat(full)}
      <span className="text-line">{"★".repeat(5 - full)}</span>
    </span>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-dashed border-line bg-cream px-6 py-12 text-center">
      <h3 className="font-serif text-2xl">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
    </div>
  );
}

export function PageHeader({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-muted">{eyebrow}</p> : null}
        <h1 className="mt-1 font-serif text-4xl leading-tight">{title}</h1>
        {body ? <p className="mt-2 max-w-2xl text-sm text-muted">{body}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function ScreenLoading() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <p className="text-sm uppercase tracking-[0.18em] text-muted">Loading</p>
    </div>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-sm text-clay">{children}</p>;
}
