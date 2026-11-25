import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Notice, Role } from "../types";

const links: { href: string; label: string; roles: Role[] }[] = [
  { href: "/app", label: "Overview", roles: ["admin", "organizer", "exhibitor", "attendee"] },
  { href: "/app/events", label: "Events", roles: ["organizer"] },
  { href: "/app/sessions", label: "Sessions", roles: ["organizer"] },
  { href: "/app/approvals", label: "Approvals", roles: ["admin"] },
  { href: "/app/users", label: "People", roles: ["admin"] },
  { href: "/app/categories", label: "Categories", roles: ["admin"] },
  { href: "/app/reviews", label: "Reviews", roles: ["admin"] },
  { href: "/app/booths", label: "Booths", roles: ["admin", "organizer", "exhibitor"] },
  { href: "/app/bookings", label: "Bookings", roles: ["admin", "organizer", "exhibitor", "attendee"] },
  { href: "/app/checkin", label: "Check-in", roles: ["admin", "organizer"] },
  { href: "/app/agenda", label: "Agenda", roles: ["attendee", "exhibitor"] },
  { href: "/app/profile", label: "Profile", roles: ["admin", "organizer", "exhibitor", "attendee"] },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  useEffect(() => {
    api.get<{ notifications: Notice[]; unread: number }>("/notifications").then((response) => {
      setNotices(response.data.notifications);
      setUnread(response.data.unread);
    }).catch(() => undefined);
  }, []);

  async function markRead() {
    if (!unread) return;
    await api.patch("/notifications/read");
    setUnread(0);
    setNotices((current) => current.map((notice) => ({ ...notice, read: true })));
  }

  if (!user) return null;

  return (
    <div className="min-h-screen md:grid md:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-cream md:min-h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/" className="font-serif text-2xl">EventSphere</Link>
          <button className="border border-line px-3 py-1 text-xs uppercase tracking-[0.14em] md:hidden" type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        <nav className={`${menuOpen ? "block" : "hidden"} px-3 pb-6 md:block`}>
          {links.filter((link) => link.roles.includes(user.role)).map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === "/app"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) => `mb-1 block px-3 py-2 text-sm ${isActive ? "bg-ink text-cream" : "text-ink hover:bg-paper"}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div>
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 md:px-8">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">{user.role}</p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="border border-line px-3 py-2 text-sm"
                aria-expanded={noticeOpen}
                onClick={() => {
                  setNoticeOpen((value) => !value);
                  void markRead();
                }}
              >
                Notices{unread ? ` (${unread})` : ""}
              </button>
              {noticeOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-80 border border-line bg-cream p-3 shadow-card">
                  {notices.length === 0 ? <p className="text-sm text-muted">No notices yet.</p> : null}
                  <ul className="space-y-3">
                    {notices.map((notice) => (
                      <li key={notice._id} className="text-sm">
                        <Link to={notice.link || "/app"} className="font-medium" onClick={() => setNoticeOpen(false)}>
                          {notice.title}
                        </Link>
                        <p className="text-muted">{notice.body}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="text-sm underline-offset-4 hover:underline"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              Sign out
            </button>
          </div>
        </header>
        <div className="px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
