import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, CheckCircle } from 'lucide-react';
import { fetchAppointmentsFromBackend } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';

export default function DashboardPastAppointments() {
  const { user, userAppointments } = useAuth();
  const [pastAppointments, setPastAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const userEmail = (user?.email || '').trim().toLowerCase();

  useEffect(() => {
    if (!userEmail) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchAppointmentsFromBackend().then((list) => {
      const mine = list.filter(
        (a) => (a.userEmail || '').trim().toLowerCase() === userEmail && a.completed && !a.cancelled
      );
      setPastAppointments(
        mine.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''))
      );
      setLoading(false);
    });
  }, [userEmail, userAppointments.length]);

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-section-title">
        <History size={22} aria-hidden /> Past appointments
      </h2>
      <p className="dashboard-hint">Appointments we’ve completed. When we mark one done, it shows here.</p>
      {loading ? (
        <div className="appointment-list-skeleton appointment-list--past" aria-busy="true" aria-label="Loading past appointments">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="appointment-card-skeleton appointment-card--past">
              <Skeleton className="appointment-skeleton-check" />
              <Skeleton className="appointment-skeleton-main" />
              <Skeleton className="appointment-skeleton-details" />
            </div>
          ))}
        </div>
      ) : pastAppointments.length === 0 ? (
        <div className="empty-state">
          <p>No past appointments yet.</p>
          <p className="dashboard-hint">When we complete an appointment, it will appear here with a checkmark.</p>
        </div>
      ) : (
        <ul className="appointment-list appointment-list--past">
          {pastAppointments.map((a) => (
            <li key={a.id || a.backendId} className="appointment-card appointment-card--past">
              <span className="appointment-card-check" aria-hidden>
                <CheckCircle size={22} />
              </span>
              <div className="appt-main">
                <span className="appt-service">{a.service}</span>
                <span className="appt-price">${a.price}</span>
              </div>
              <div className="appt-details">
                <span>{a.date} at {a.time}</span>
                <span>{a.address}</span>
                {a.vehicle && a.vehicle !== 'Not specified' && <span>{a.vehicle}</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
