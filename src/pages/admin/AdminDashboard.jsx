import { useMemo } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { DollarSign, ClipboardList, CalendarDays, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const { appointments, loading } = useOutletContext();

  const revenue = useMemo(
    () => appointments
      .filter((a) => a.completed && !a.cancelled)
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0),
    [appointments]
  );

  const scheduled = useMemo(
    () => appointments
      .filter((a) => !a.completed && !a.cancelled)
      .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (a.date || '').localeCompare(b.date || '')))
      .slice(0, 5),
    [appointments]
  );

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Dashboard</h2>

      <section className="admin-section admin-dashboard-section admin-revenue-section">
        <h3 className="admin-dashboard-section-title">
          <DollarSign size={22} aria-hidden /> Revenue
        </h3>
        <div className="admin-revenue-card">
          <DollarSign size={32} aria-hidden className="admin-revenue-icon" />
          <div>
            <span className="admin-revenue-label">Completed jobs total</span>
            <span className="admin-revenue-value">${revenue.toLocaleString()}</span>
          </div>
        </div>
        <Link to="/admin/revenue" className="admin-link-more">View revenue →</Link>
      </section>

      <section className="admin-section admin-dashboard-section">
        <h3 className="admin-dashboard-section-title">
          <Clock size={22} aria-hidden /> Upcoming
        </h3>
        {loading ? (
          <p className="calendar-loading">Loading…</p>
        ) : scheduled.length === 0 ? (
          <p className="admin-bookings-empty">No upcoming appointments.</p>
        ) : (
          <>
            <ul className="admin-dashboard-upcoming">
              {scheduled.map((a) => (
                <li key={a.id}>
                  <span className="admin-upcoming-date">{a.date}</span>
                  <span className="admin-upcoming-time">{a.time}</span>
                  <span className="admin-upcoming-service">{a.service}</span>
                  <span className="admin-upcoming-name">{a.userName || '—'}</span>
                </li>
              ))}
            </ul>
            <Link to="/admin/bookings" className="admin-link-more">
              <ClipboardList size={18} /> All bookings
            </Link>
          </>
        )}
      </section>

      <div className="admin-dashboard-quick-links">
        <Link to="/admin/calendar" className="admin-quick-link">
          <CalendarDays size={24} /> Calendar
        </Link>
        <Link to="/admin/availability" className="admin-quick-link">
          <Clock size={24} /> Block time (I&apos;m busy)
        </Link>
      </div>
    </div>
  );
}
