import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  LogOut,
  Lock,
  RefreshCw,
  Phone,
  User,
  X,
  CheckCircle,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { fetchAppointmentsFromBackend, updateAppointmentInBackend } from '../lib/supabase';
import { geocodeAppointments } from '../lib/geocode';
import 'leaflet/dist/leaflet.css';

const ADMIN_STORAGE_KEY = 'doublea_admin';
const ADMIN_USER = 't';
const ADMIN_PASS = 't';

const WINTER_PARK_CENTER = [28.6001, -81.3392];
const WINTER_PARK_BOUNDS = L.latLngBounds(
  [28.55, -81.45],
  [28.65, -81.25]
);

const RED_ICON = new L.DivIcon({
  className: 'red-marker',
  html: '<div class="red-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function isAdminSession() {
  return sessionStorage.getItem(ADMIN_STORAGE_KEY) === '1';
}

export default function Admin() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(isAdminSession());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [withCoords, setWithCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const refetchAppointments = async () => {
    setLoading(true);
    const list = await fetchAppointmentsFromBackend();
    setAppointments(list);
    const withLatLng = await geocodeAppointments(list);
    setWithCoords(withLatLng);
    setLoading(false);
  };

  useEffect(() => {
    if (!authenticated) return;
    refetchAppointments();
  }, [authenticated]);

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

  const revenue = useMemo(
    () => appointments
      .filter((a) => a.completed && !a.cancelled)
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0),
    [appointments]
  );

  const scheduledAppointments = useMemo(
    () => appointments.filter((a) => !a.completed && !a.cancelled),
    [appointments]
  );
  const previousDetailsAppointments = useMemo(
    () => appointments.filter((a) => a.completed && !a.cancelled).sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (b.date || '').localeCompare(a.date || ''))),
    [appointments]
  );
  const cancelledAppointments = useMemo(
    () => appointments.filter((a) => a.cancelled).sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (b.date || '').localeCompare(a.date || ''))),
    [appointments]
  );
  const activeAppointments = useMemo(() => appointments.filter((a) => !a.cancelled), [appointments]);

  const handleMarkDone = async (id) => {
    await updateAppointmentInBackend(id, { completed: true });
    refetchAppointments();
  };

  const handleCancel = async (id) => {
    await updateAppointmentInBackend(id, { cancelled: true });
    refetchAppointments();
  };

  const daysInMonth = useMemo(() => {
    const start = new Date(month.year, month.month, 1);
    const end = new Date(month.year, month.month + 1, 0);
    const firstDay = start.getDay();
    const days = end.getDate();
    const prevMonth = new Date(month.year, month.month, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: prevMonth - firstDay + i + 1, current: false, date: null });
    }
    for (let d = 1; d <= days; d++) {
      const dateStr = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ day: d, current: true, date: dateStr });
    }
    const remaining = 42 - grid.length;
    for (let r = 1; r <= remaining; r++) {
      grid.push({ day: r, current: false, date: null });
    }
    return grid;
  }, [month.year, month.month]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    activeAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.keys(map).forEach((d) => map[d].sort((x, y) => (x.time || '').localeCompare(y.time || '')));
    return map;
  }, [activeAppointments]);

  const monthLabel = useMemo(() => {
    return new Date(month.year, month.month).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [month]);

  const prevMonth = () => {
    if (month.month === 0) setMonth({ year: month.year - 1, month: 11 });
    else setMonth({ ...month, month: month.month - 1 });
  };

  const nextMonth = () => {
    if (month.month === 11) setMonth({ year: month.year + 1, month: 0 });
    else setMonth({ ...month, month: month.month + 1 });
  };

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return (appointmentsByDate[selectedDate] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [selectedDate, appointmentsByDate]);

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (!authenticated) {
    return (
      <main className="page admin-page">
        <div className="auth-card admin-login-card">
          <h1 className="admin-login-title">
            <Lock size={28} aria-hidden /> Admin
          </h1>
          <p className="admin-login-sub">Sign in to view the dashboard.</p>
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

  return (
    <main className="page admin-dashboard-page">
      <div className="admin-dashboard-header">
        <h1>Admin dashboard</h1>
        <div className="admin-dashboard-actions">
          <button
            type="button"
            className="btn-ghost admin-refresh"
            onClick={() => refetchAppointments()}
            disabled={loading}
            aria-label="Refresh calendar"
          >
            <RefreshCw size={18} aria-hidden className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button type="button" className="btn-ghost admin-logout" onClick={handleLogout}>
            <LogOut size={18} aria-hidden /> Log out
          </button>
        </div>
      </div>

      {/* ——— Revenue ——— */}
      <section className="admin-section admin-dashboard-section admin-revenue-section" id="admin-revenue" aria-labelledby="admin-revenue-heading">
        <h2 id="admin-revenue-heading" className="admin-dashboard-section-title">
          <DollarSign size={22} aria-hidden /> Revenue
        </h2>
        <div className="admin-revenue-card">
          <DollarSign size={32} aria-hidden className="admin-revenue-icon" />
          <div>
            <span className="admin-revenue-label">Completed jobs total</span>
            <span className="admin-revenue-value">${revenue.toLocaleString()}</span>
          </div>
        </div>
      </section>

      {/* ——— Calendar ——— */}
      <section className="admin-section admin-dashboard-section calendar-section" id="admin-calendar" aria-labelledby="admin-calendar-heading">
        <h2 id="admin-calendar-heading" className="admin-dashboard-section-title">
          <CalendarDays size={22} aria-hidden /> Calendar
        </h2>
        {loading ? (
          <p className="calendar-loading">Loading appointments…</p>
        ) : (
          <>
            <div className="calendar-header">
              <button type="button" className="btn-ghost month-nav" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft size={24} />
              </button>
              <h3 className="calendar-month">{monthLabel}</h3>
              <button type="button" className="btn-ghost month-nav" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="calendar-weekday">{d}</div>
              ))}
              {daysInMonth.map((cell, i) => {
                const list = cell.date ? appointmentsByDate[cell.date] || [] : [];
                return (
                  <button
                    key={i}
                    type="button"
                    className={`calendar-day ${cell.current ? 'current' : 'other'} ${list.length > 0 ? 'has-appts clickable' : ''}`}
                    onClick={list.length > 0 ? () => setSelectedDate(cell.date) : undefined}
                    disabled={list.length === 0}
                  >
                    <span className="calendar-day-num">{cell.day}</span>
                    {list.length > 0 && (
                      <ul className="calendar-day-list">
                        {list.slice(0, 3).map((a) => (
                          <li key={a.id}>
                            {a.time} – {a.service} {a.address ? `@ ${a.address.slice(0, 20)}…` : ''}
                          </li>
                        ))}
                        {list.length > 3 && <li className="more">+{list.length - 3} more</li>}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="admin-calendar-map-wrap">
              <h3 className="map-title">
                <MapPin size={20} aria-hidden /> Map – Winter Park, FL
              </h3>
              <div className="map-wrap map-wrap--admin">
                <MapContainer
                  center={WINTER_PARK_CENTER}
                  zoom={13}
                  className="map-container"
                  scrollWheelZoom
                  maxBounds={WINTER_PARK_BOUNDS}
                  maxBoundsViscosity={1}
                  minZoom={12}
                  maxZoom={18}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {withCoords.filter((a) => !a.cancelled).map((a) => (
                    <Marker key={a.id} position={[a.lat, a.lng]} icon={RED_ICON}>
                      <Popup className="admin-map-popup">
                        <div className="admin-popup-content">
                          <span className="admin-popup-time">{a.date} · {a.time}</span>
                          <span className="admin-popup-service">{a.service} — ${a.price}</span>
                          {a.userName && <span className="admin-popup-name">{a.userName}</span>}
                          {a.userPhone && <span className="admin-popup-phone">{a.userPhone}</span>}
                          <span className="admin-popup-address">{a.address}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ——— Bookings ——— */}
      <section className="admin-section admin-dashboard-section admin-bookings-section" id="admin-bookings" aria-labelledby="admin-bookings-heading">
        <h2 id="admin-bookings-heading" className="admin-dashboard-section-title">
          <ClipboardList size={22} aria-hidden /> Bookings
        </h2>

        {scheduledAppointments.length > 0 && (
          <div className="admin-bookings-subsection">
            <h3 className="admin-section-title">
              <Phone size={20} aria-hidden /> Scheduled
            </h3>
            <div className="admin-contacts-card">
              <div className="admin-contacts-header">
                <span>Name</span>
                <span>Phone</span>
                <span>Package</span>
                <span>Date</span>
                <span>Time</span>
                <span className="admin-contact-actions-head">Done / Cancel</span>
              </div>
              <ul className="admin-contacts-list">
                {scheduledAppointments
                  .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (a.date || '').localeCompare(b.date || '')))
                  .map((a) => (
                    <li key={a.id} className="admin-contact-row">
                      <span className="admin-contact-name">{a.userName || '—'}</span>
                      <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
                        {a.userPhone || '—'}
                      </a>
                      <span className="admin-contact-package">{a.service || '—'}</span>
                      <span className="admin-contact-date">{a.date}</span>
                      <span className="admin-contact-time">{a.time}</span>
                      <div className="admin-contact-actions">
                        <button
                          type="button"
                          className="btn-ghost admin-contact-done"
                          onClick={() => handleMarkDone(a.id)}
                          title="Mark as done"
                          aria-label={`Mark ${a.userName || 'appointment'} as done`}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost admin-contact-cancel"
                          onClick={() => handleCancel(a.id)}
                          title="Cancel appointment"
                          aria-label="Cancel appointment"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        )}

        {previousDetailsAppointments.length > 0 && (
          <div className="admin-bookings-subsection">
            <h3 className="admin-section-title">
              <CheckCircle size={20} aria-hidden /> Previous details
            </h3>
            <p className="admin-section-desc">Completed jobs — revenue is added from these.</p>
            <div className="admin-contacts-card">
              <div className="admin-contacts-header">
                <span>Name</span>
                <span>Phone</span>
                <span>Package</span>
                <span>Date</span>
                <span>Time</span>
                <span className="admin-contact-amount">Amount</span>
              </div>
              <ul className="admin-contacts-list">
                {previousDetailsAppointments.map((a) => (
                  <li key={a.id} className="admin-contact-row admin-contact-row--previous">
                    <span className="admin-contact-name">{a.userName || '—'}</span>
                    <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
                      {a.userPhone || '—'}
                    </a>
                    <span className="admin-contact-package">{a.service || '—'}</span>
                    <span className="admin-contact-date">{a.date}</span>
                    <span className="admin-contact-time">{a.time}</span>
                    <span className="admin-contact-amount">${a.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {cancelledAppointments.length > 0 && (
          <div className="admin-bookings-subsection">
            <h3 className="admin-section-title">
              <XCircle size={20} aria-hidden /> Cancelled
            </h3>
            <div className="admin-contacts-card admin-contacts-card--cancelled">
              <div className="admin-contacts-header">
                <span>Name</span>
                <span>Phone</span>
                <span>Package</span>
                <span>Date</span>
                <span>Time</span>
              </div>
              <ul className="admin-contacts-list">
                {cancelledAppointments.map((a) => (
                  <li key={a.id} className="admin-contact-row admin-contact-row--cancelled">
                    <span className="admin-contact-name">{a.userName || '—'}</span>
                    <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
                      {a.userPhone || '—'}
                    </a>
                    <span className="admin-contact-package">{a.service || '—'}</span>
                    <span className="admin-contact-date">{a.date}</span>
                    <span className="admin-contact-time">{a.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!loading && scheduledAppointments.length === 0 && previousDetailsAppointments.length === 0 && cancelledAppointments.length === 0 && (
          <p className="admin-bookings-empty">No bookings yet.</p>
        )}
      </section>

      {selectedDate && (
        <div className="admin-day-modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="admin-day-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-day-modal-header">
              <h3>Appointments for {formatDisplayDate(selectedDate)}</h3>
              <button type="button" className="btn-ghost admin-day-modal-close" onClick={() => setSelectedDate(null)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <ul className="admin-day-modal-list">
              {selectedDayAppointments.map((a) => (
                <li key={a.id} className="admin-day-modal-item">
                  <div className="admin-day-modal-block">
                    <span className="admin-day-modal-block-label">Time</span>
                    <span className="admin-day-modal-time">{a.time}</span>
                  </div>
                  <div className="admin-day-modal-block">
                    <span className="admin-day-modal-block-label">Package</span>
                    <span className="admin-day-modal-package">{a.service} — ${a.price}</span>
                  </div>
                  <div className="admin-day-modal-block">
                    <span className="admin-day-modal-block-label">Customer</span>
                    <span className="admin-day-modal-name">{a.userName ? <><User size={16} aria-hidden /> {a.userName}</> : '—'}</span>
                  </div>
                  {a.userPhone && (
                    <div className="admin-day-modal-block">
                      <span className="admin-day-modal-block-label">Phone</span>
                      <a href={`tel:${a.userPhone.replace(/\D/g, '')}`} className="admin-day-modal-phone">
                        <Phone size={16} aria-hidden /> {a.userPhone}
                      </a>
                    </div>
                  )}
                  <div className="admin-day-modal-block">
                    <span className="admin-day-modal-block-label">Address</span>
                    <span className="admin-day-modal-address">{a.address}</span>
                  </div>
                  <div className="admin-day-modal-actions">
                    <button
                      type="button"
                      className="btn-ghost admin-day-done"
                      onClick={() => { handleMarkDone(a.id); setSelectedDate(null); }}
                      disabled={a.completed}
                      title="Mark as done"
                    >
                      <CheckCircle size={18} /> {a.completed ? 'Done' : 'Mark done'}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost admin-day-cancel"
                      onClick={() => { handleCancel(a.id); setSelectedDate(null); }}
                      disabled={a.cancelled}
                      title="Cancel"
                    >
                      <XCircle size={18} /> Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </main>
  );
}
