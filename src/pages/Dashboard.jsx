import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Plus, XCircle } from 'lucide-react';

export default function Dashboard() {
  const { user, userAppointments, cancelAppointment } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <main className="page dashboard-page">
      <div className="dashboard-wrap">
        <h1>
          <CalendarDays size={28} aria-hidden /> My appointments
        </h1>
        <p className="dashboard-greeting">Hi, {user.name}.</p>
        {userAppointments.length === 0 ? (
          <div className="empty-state">
            <p>No appointments yet.</p>
            <Link to="/book" className="btn-primary">Book one</Link>
          </div>
        ) : (
          <ul className="appointment-list">
            {userAppointments.map((a) => (
              <li key={a.id} className="appointment-card">
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
                  onClick={() => cancelAppointment(a.id)}
                  aria-label={`Cancel appointment on ${a.date}`}
                >
                  <XCircle size={18} aria-hidden /> Cancel
                </button>
              </li>
            ))}
          </ul>
        )}
        <Link to="/book" className="dashboard-book">
          <Plus size={20} aria-hidden /> New appointment
        </Link>
      </div>
    </main>
  );
}
