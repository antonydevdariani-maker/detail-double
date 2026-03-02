import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { History, CheckCircle } from 'lucide-react';
import { fetchAppointmentsFromBackend } from '../lib/supabase';

export default function DashboardPastAppointments() {
  const { user, userAppointments } = useAuth();
  const [pastAppointments, setPastAppointments] = useState([]);

  const userEmail = (user?.email || '').trim().toLowerCase();

  useEffect(() => {
    if (!userEmail) return;
    fetchAppointmentsFromBackend().then((list) => {
      const mine = list.filter(
        (a) => (a.userEmail || '').trim().toLowerCase() === userEmail && a.completed && !a.cancelled
      );
      setPastAppointments(
        mine.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''))
      );
    });
  }, [userEmail, userAppointments.length]);

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-section-title">
        <History size={22} aria-hidden /> Past appointments
      </h2>
      <p className="dashboard-hint">Appointments we’ve completed. When we mark one done, it shows here.</p>
      {pastAppointments.length === 0 ? (
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
