import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { SiteLayout } from "./components/SiteLayout";
import { AppLayout } from "./components/AppLayout";
import { ScreenLoading } from "./components/ui";
import { Home } from "./pages/Home";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { NotFound } from "./pages/NotFound";
import { Overview } from "./pages/app/Overview";
import { BookingsPage } from "./pages/app/BookingsPage";
import { AgendaPage } from "./pages/app/AgendaPage";
import { EventEditor, EventsManage } from "./pages/app/EventsManage";
import { SessionsPage } from "./pages/app/SessionsPage";
import { BoothsPage } from "./pages/app/BoothsPage";
import { CheckInPage } from "./pages/app/CheckInPage";
import { ApprovalsPage, CategoriesPage, ReviewsPage, UsersPage } from "./pages/app/AdminPages";
import { ProfilePage } from "./pages/app/ProfilePage";
import type { Role } from "./types";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <ScreenLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <ScreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/app" replace />;
  return children;
}

export function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<Home />} />
        <Route path="events" element={<Events />} />
        <Route path="events/:id" element={<EventDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>
      <Route
        path="app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Overview />} />
        <Route path="bookings" element={<BookingsPage />} />
        <Route path="agenda" element={<RequireRole roles={["attendee", "exhibitor"]}><AgendaPage /></RequireRole>} />
        <Route path="events" element={<RequireRole roles={["organizer"]}><EventsManage /></RequireRole>} />
        <Route path="events/new" element={<RequireRole roles={["organizer"]}><EventEditor /></RequireRole>} />
        <Route path="events/:id/edit" element={<RequireRole roles={["organizer"]}><EventEditor /></RequireRole>} />
        <Route path="sessions" element={<RequireRole roles={["organizer"]}><SessionsPage /></RequireRole>} />
        <Route path="booths" element={<RequireRole roles={["organizer", "exhibitor", "admin"]}><BoothsPage /></RequireRole>} />
        <Route path="checkin" element={<RequireRole roles={["organizer", "admin"]}><CheckInPage /></RequireRole>} />
        <Route path="approvals" element={<RequireRole roles={["admin"]}><ApprovalsPage /></RequireRole>} />
        <Route path="users" element={<RequireRole roles={["admin"]}><UsersPage /></RequireRole>} />
        <Route path="categories" element={<RequireRole roles={["admin"]}><CategoriesPage /></RequireRole>} />
        <Route path="reviews" element={<RequireRole roles={["admin"]}><ReviewsPage /></RequireRole>} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
