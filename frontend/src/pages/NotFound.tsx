import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">404</p>
      <h1 className="mt-3 font-serif text-5xl">This page is off the program.</h1>
      <Link to="/" className="mt-6 inline-block text-sm underline-offset-4 hover:underline">Back home</Link>
    </div>
  );
}
