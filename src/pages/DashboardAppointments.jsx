import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, XCircle } from 'lucide-react';
import { fetchAppointmentsFromBackend, updateAppointmentInBackend } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';

export default function DashboardAppointments() {
  const { user, userAppointments, cancelAppointment } = useAuth();
  const [backendAppointments, setBackendAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = (user?.email || '').trim().toLowerCase();

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAppointmentsFromBackend().then((list) => {
      const mine = list.filter((a) => (a.userEmail || '').trim().toLowerCase() === userEmail && !a.cancelled);
      setBackendAppointments(mine);
      setLoading(false);
    });
  }, [userEmail, userAppointments.length]);

  const scheduled = backendAppointments.filter((a) => !a.completed);
  const myScheduled = backendAppointments.length > 0 ? scheduled : userAppointments.filter((a) => !a.completed);

  const handleCancel = async (appt) => {
    const backendId = appt.backendId ?? appt.id;
    if (backendId) await updateAppointmentInBackend(backendId, { cancelled: true });
    if (appt.backendId) cancelAppointment(appt.id);
    const list = await fetchAppointmentsFromBackend();
    const mine = list.filter((a) => (a.userEmail || '').trim().toLowerCase() === userEmail && !a.cancelled);
    setBackendAppointments(mine);
  };

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-section-title">
        <CalendarDays size={22} aria-hidden /> My appointments
      </h2>
      {loading ? (
        <div className="appointment-list-skeleton" aria-busy="true" aria-label="Loading appointments">
          {[1, 2, 3].map((i) => (
            <div key={i} className="appointment-card-skeleton">
              <Skeleton className="appointment-skeleton-main" />
              <Skeleton className="appointment-skeleton-details" />
              <Skeleton className="appointment-skeleton-btn" />
            </div>
          ))}
        </div>
      ) : myScheduled.length === 0 ? (
        <div className="empty-state">
          <p>No upcoming appointments.</p>
          <p className="dashboard-hint">
            <Link to="/dashboard" className="dashboard-hint-link">Book one</Link> or use the home page to book.
          </p>
        </div>
      ) : (
        <ul className="appointment-list">
          {myScheduled.map((a) => (
            <li key={a.id || a.backendId} className="appointment-card">
              <div className="appt-main">
                <span className="appt-service">{a.service}</span>
                <span className="appt-price">${a.price}</span>
              </div>
              <div className="appt-details">
                <span>{a.date} at {a.time}</span>
                <span>{a.address}</span>
                {a.vehicle && a.vehicle !== 'Not specified' && <span>{a.vehicle}</span>}
              </div>
              <button
                type="button"
                className="btn-ghost cancel"
                onClick={() => handleCancel(a)}
                aria-label={`Cancel appointment on ${a.date}`}
              >
                <XCircle size={18} aria-hidden /> Cancel
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
