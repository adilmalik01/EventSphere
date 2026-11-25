import type { EventItem } from "../types";

export function money(value: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function when(value?: string, withTime = false) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function toInputDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function categoryName(event: EventItem) {
  return typeof event.category === "string" ? "Event" : event.category?.name || "Event";
}

export function organizerName(event: EventItem) {
  return typeof event.organizer === "string" ? "Organizer" : event.organizer?.name || "Organizer";
}

export function isPast(value?: string) {
  return Boolean(value && new Date(value).getTime() < Date.now());
}
