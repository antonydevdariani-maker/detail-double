import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CalendarCheck } from 'lucide-react';
import { SERVICE_OPTIONS } from '../constants/services';

export default function Book() {
  const { user, addAppointment } = useAuth();
  const navigate = useNavigate();
  const [service, setService] = useState('exterior');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [address, setAddress] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [booked, setBooked] = useState(false);

  const selected = SERVICE_OPTIONS.find(o => o.id === service);
  const price = selected?.price ?? 60;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/signup');
      return;
    }
    addAppointment({
      service: selected?.label ?? 'Exterior',
      price,
      date,
      time,
      address,
      vehicle: vehicle || 'Not specified',
    });
    setBooked(true);
  };

  if (booked) {
    return (
      <main className="page book-page">
        <div className="auth-card confirm-card">
          <h1>Booked</h1>
          <p>Your appointment is set. We’ll see you then.</p>
          <Link to="/dashboard" className="btn-primary">
            <CalendarCheck size={20} aria-hidden /> View my appointments
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page book-page">
      <div className="auth-card book-card">
        <h1>Book an appointment</h1>
        {!user && (
          <p className="book-login">
            <Link to="/login">Log in</Link> or <Link to="/signup">Sign up</Link> to book.
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="service-label">Service</label>
          <div className="service-options">
            {SERVICE_OPTIONS.map((opt) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={`service-opt ${service === opt.id ? 'active' : ''}`}
                  onClick={() => setService(opt.id)}
                >
                  <Icon size={20} strokeWidth={1.75} aria-hidden />
                  <span>{opt.label}</span>
                  <span className="opt-price">${opt.price}</span>
                </button>
              );
            })}
          </div>

          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              min={new Date().toISOString().slice(0, 10)}
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </label>
          <label>
            Address (where we’ll come)
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, ZIP"
              required
            />
          </label>
          <label>
            Vehicle (optional)
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. 2020 Honda Accord"
            />
          </label>

          <p className="book-total">Total: ${price}</p>
          {user ? (
            <button type="submit" className="btn-primary">Book appointment</button>
          ) : (
            <Link to="/signup" className="btn-primary" style={{ display: 'flex', textAlign: 'center' }}>Sign up to book</Link>
          )}
        </form>
      </div>
    </main>
  );
}
