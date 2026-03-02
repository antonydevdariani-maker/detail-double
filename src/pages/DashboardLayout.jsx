import { Navigate, Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Tag, CalendarCheck, History } from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: '/dashboard', end: true, label: 'Book', Icon: CalendarCheck },
    { to: '/dashboard/appointments', end: false, label: 'My appointments', Icon: CalendarDays },
    { to: '/dashboard/past-appointments', end: false, label: 'Past appointments', Icon: History },
    { to: '/dashboard/discounts', end: false, label: 'Discounts', Icon: Tag },
  ];

  return (
    <main className="page dashboard-page">
      <div className="dashboard-wrap">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="dashboard-greeting">Hi, {user.name}.</p>
        </div>
        <nav className="dashboard-nav" aria-label="Dashboard sections">
          <ul className="dashboard-nav-list">
            {navLinks.map(({ to, end, label, Icon }) => (
              <li key={to}>
                <NavLink to={to} end={end} className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                  <Icon size={18} aria-hidden /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="dashboard-outlet">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
