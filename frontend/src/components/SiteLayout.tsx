import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm ${isActive ? "text-ink" : "text-muted hover:text-ink"}`;

export function SiteLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-cream">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-2xl tracking-tight">
            EventSphere
          </Link>
          <button className="border border-line px-3 py-2 text-sm md:hidden" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            Menu
          </button>
          <nav className={`${open ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-4 border-b border-line bg-paper px-4 py-4 md:static md:flex md:flex-row md:items-center md:gap-6 md:border-0 md:bg-transparent md:p-0`}>
            <NavLink to="/events" className={linkClass} onClick={() => setOpen(false)}>
              Events
            </NavLink>
            {user ? (
              <NavLink to="/app" className={linkClass} onClick={() => setOpen(false)}>
                Dashboard
              </NavLink>
            ) : (
              <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                Sign in
              </NavLink>
            )}
            <Link to={user ? "/app" : "/register"} className="bg-ink px-4 py-2 text-center text-sm text-cream" onClick={() => setOpen(false)}>
              {user ? user.name.split(" ")[0] : "Create account"}
            </Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="mt-20 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-4 py-10">
          <div>
            <p className="font-serif text-3xl">EventSphere</p>
            <p className="mt-2 max-w-sm text-sm text-muted">Events, booths, sessions, and tickets on one record.</p>
          </div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Demo payments only. Card numbers are never stored.</p>
        </div>
      </footer>
    </div>
  );
}
