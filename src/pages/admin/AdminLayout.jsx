import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { LogOut, Lock, RefreshCw } from 'lucide-react';
import { fetchAppointmentsFromBackend, updateAppointmentInBackend, fetchBlockedSlotsFromBackend } from '../../lib/supabase';
import { geocodeAppointments } from '../../lib/geocode';

const ADMIN_STORAGE_KEY = 'doublea_admin';
const ADMIN_USER = 't';
const ADMIN_PASS = 't';

function isAdminSession() {
  return sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1';
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAdminSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [withCoords, setWithCoords] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const refetchAppointments = useCallback(async () => {
    setLoading(true);
    const list = await fetchAppointmentsFromBackend();
    setAppointments(list);
    const withLatLng = await geocodeAppointments(list);
    setWithCoords(withLatLng);
    setLoading(false);
  }, []);

  const refetchBlockedSlots = useCallback(async () => {
    const list = await fetchBlockedSlotsFromBackend();
    setBlockedSlots(list);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    refetchAppointments();
    refetchBlockedSlots();
  }, [authenticated, refetchAppointments, refetchBlockedSlots]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      sessionStorage.setItem(ADMIN_STORAGE_KEY, '1');
      setAuthenticated(true);
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setAuthenticated(false);
    navigate('/');
  };

  const handleMarkDone = async (id) => {
    await updateAppointmentInBackend(id, { completed: true });
    refetchAppointments();
  };

  const handleCancel = async (id) => {
    await updateAppointmentInBackend(id, { cancelled: true });
    refetchAppointments();
  };

  if (!authenticated) {
    return (
      <main className="page admin-page">
        <div className="auth-card admin-login-card">
          <h1 className="admin-login-title">
            <Lock size={28} aria-hidden /> Admin
          </h1>
          <p className="admin-login-sub">For owners only. Sign in to manage appointments, set up your calendar, and run your business.</p>
          <form onSubmit={handleLogin}>
            {loginError && <p className="auth-error">{loginError}</p>}
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn-primary">Sign in</button>
          </form>
        </div>
      </main>
    );
  }

  const navLinks = [
    { to: '/admin', end: true, label: 'Dashboard' },
    { to: '/admin/calendar', end: false, label: 'Calendar' },
    { to: '/admin/add-appointment', end: false, label: 'Add appointment' },
    { to: '/admin/availability', end: false, label: 'Availability' },
    { to: '/admin/coupons', end: false, label: 'Coupons' },
    { to: '/admin/past-appointments', end: false, label: 'Past appointments' },
    { to: '/admin/bookings', end: false, label: 'Bookings' },
    { to: '/admin/revenue', end: false, label: 'Revenue' },
  ];

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Admin</h1>
        <div className="admin-dashboard-actions">
          <button
            type="button"
            className="btn-ghost admin-refresh"
            onClick={() => { refetchAppointments(); refetchBlockedSlots(); }}
            disabled={loading}
            aria-label="Refresh"
          >
            <RefreshCw size={18} aria-hidden className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button type="button" className="btn-ghost admin-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden /> Log out
          </button>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Admin sections">
        <ul className="admin-nav-list">
          {navLinks.map(({ to, end, label }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="admin-outlet">
        <Outlet
          context={{
            appointments,
            withCoords,
            blockedSlots,
            loading,
            refetchAppointments,
            refetchBlockedSlots,
            handleMarkDone,
            handleCancel,
          }}
        />
      </div>
    </main>
  );
}
