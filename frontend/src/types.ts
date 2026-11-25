export type Role = "admin" | "organizer" | "exhibitor" | "attendee";
export type Tone = "clay" | "pine" | "ink" | "gold" | "dusk";
export type EventStatus = "draft" | "pending" | "approved" | "rejected" | "completed";

export type User = {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone: string;
  company: string;
  bio: string;
  status: "active" | "suspended";
};

export type Category = { _id: string; name: string; description: string };

export type Ticket = {
  _id?: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

export type EventItem = {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  category: Category | string;
  organizer: { _id: string; name: string; company?: string } | string;
  city: string;
  venue: string;
  startDate: string;
  endDate: string;
  capacity: number;
  tone: Tone;
  highlights: string[];
  status: EventStatus;
  reviewNote?: string;
  tickets?: Ticket[];
  sold?: number;
  priceFrom?: number;
};

export type SessionItem = {
  _id: string;
  title: string;
  speaker: string;
  hall: string;
  description: string;
  startTime: string;
  endTime: string;
  capacity: number;
  registered: number;
  event?: { _id: string; title: string; startDate?: string; endDate?: string; city?: string };
};

export type ReviewItem = {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { _id: string; name: string; email?: string };
  event?: { _id: string; title: string };
};

export type BoothItem = {
  _id: string;
  company: string;
  size: "3x3" | "3x6" | "6x6";
  price: number;
  pitch: string;
  status: "requested" | "approved" | "rejected";
  note?: string;
  event?: { _id: string; title: string; city?: string; startDate?: string; status?: string };
  exhibitor?: { _id: string; name: string; email: string; company?: string };
};

export type BookingItem = {
  _id: string;
  quantity: number;
  amount: number;
  status: "confirmed" | "cancelled";
  paymentMethod: "card" | "counter";
  paymentReference: string;
  ticketCode: string;
  checkedIn: boolean;
  checkedInAt?: string;
  qr?: string;
  createdAt: string;
  user?: { _id: string; name: string; email?: string };
  event: { _id: string; title: string; city?: string; startDate?: string; venue?: string; endDate?: string };
  ticketType?: { _id: string; name: string; price: number };
};

export type AgendaItem = {
  _id: string;
  session: SessionItem | null;
};

export type DashCard = { label: string; value: string; note?: string };

export type DashboardPayload = {
  cards: DashCard[];
  series?: { label: string; value: number }[];
  queue?: { label: string; href: string; count: number }[];
  recentBookings?: BookingItem[];
  upcoming?: EventItem[];
  booths?: BoothItem[];
};

export type Notice = {
  _id: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
};
