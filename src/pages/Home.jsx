import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Sparkles,
  Clock,
  ShieldCheck,
  BadgeDollarSign,
  CalendarCheck,
} from 'lucide-react';
import { SERVICES_FOR_DISPLAY, SERVICE_OPTIONS } from '../constants/services';
import { fetchAppointmentsFromBackend, fetchBlockedSlotsFromBackend } from '../lib/supabase';

const WHY = [
  { title: 'We come to you', desc: 'No drop-off or wait. We detail at your home or office.', Icon: MapPin },
  { title: 'Pro-grade results', desc: 'Quality products and techniques for a showroom finish.', Icon: Sparkles },
  { title: 'Flexible scheduling', desc: 'Book a time that works. Easy to reschedule if needed.', Icon: Clock },
  { title: 'Trusted & reliable', desc: 'Consistent service and care for your vehicle every time.', Icon: ShieldCheck },
  { title: 'Clear pricing', desc: 'No hidden fees. You know the cost before we start.', Icon: BadgeDollarSign },
];

function getMinBookableDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1);
  if (day === 6) d.setDate(d.getDate() + 2);
  return d;
}

function isWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day >= 1 && day <= 5;
}

const BOOKING_HOURS = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

function formatTimeLabel(timeStr) {
  if (!timeStr) return '';
  const [h] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:00 ${period}`;
}

export default function Home() {
  const { user, addAppointment } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [service, setService] = useState('exterior');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [bookError, setBookError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [booked, setBooked] = useState(false);
  const [appointmentsForDate, setAppointmentsForDate] = useState([]);
  const [blockedForDate, setBlockedForDate] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const selected = SERVICE_OPTIONS.find((o) => o.id === service);

  // Load appointments + blocked slots when date changes so we know which times are unavailable
  useEffect(() => {
    if (!date || !isWeekday(date)) {
      setAppointmentsForDate([]);
      setBlockedForDate([]);
      return;
    }
    setAvailabilityLoading(true);
    Promise.all([fetchAppointmentsFromBackend(), fetchBlockedSlotsFromBackend()])
      .then(([appointmentsList, blockedList]) => {
        const onDay = appointmentsList.filter((a) => a.date === date && !a.cancelled);
        const blockedOnDay = blockedList.filter((b) => b.date === date);
        setAppointmentsForDate(onDay);
        setBlockedForDate(blockedOnDay);
      })
      .catch(() => {
        setAppointmentsForDate([]);
        setBlockedForDate([]);
      })
      .finally(() => setAvailabilityLoading(false));
  }, [date]);

  const unavailableHours = useMemo(() => {
    const set = new Set();
    appointmentsForDate.forEach((a) => {
      const h = (a.time || '').split(':')[0];
      if (h) set.add(h);
    });
    blockedForDate.forEach((b) => {
      const h = (b.time || '').split(':')[0];
      if (h) set.add(h);
    });
    return set;
  }, [appointmentsForDate, blockedForDate]);

  const handleTimeSelect = (slotTime) => {
    const hour = slotTime.split(':')[0];
    if (unavailableHours.has(hour)) return;
    setTime(slotTime);
  };

  // When date changes, clear time if it became unavailable
  useEffect(() => {
    if (!date || !time) return;
    const hour = time.split(':')[0];
    if (unavailableHours.has(hour)) {
      setTime(BOOKING_HOURS.find((t) => !unavailableHours.has(t.split(':')[0])) || '');
    }
  }, [date, unavailableHours]);
  const price = selected?.price ?? 60;

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
  }, [user?.name]);

  useEffect(() => {
    const hash = location.hash?.slice(1);
    const path = location.pathname;
    const target = hash === 'services' || hash === 'book' ? hash : path === '/services' ? 'services' : path === '/book' ? 'book' : null;
    if (target) {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.pathname]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBookError('');
    const minStr = getMinBookableDate().toISOString().slice(0, 10);
    if (date < minStr) {
      setBookError('Appointments must be at least 2 days from today.');
      return;
    }
    if (!isWeekday(date)) {
      setBookError('Appointments are Monday–Friday only.');
      return;
    }
    if (!time || time < '14:00' || time > '22:00') {
      setBookError('Please select an available time (we’re on jobs 6 AM–2 PM).');
      return;
    }
    const [existing, blocked] = await Promise.all([
      fetchAppointmentsFromBackend(),
      fetchBlockedSlotsFromBackend(),
    ]);
    const onSameDay = existing.filter((a) => a.date === date && !a.cancelled);
    const bookedHours = new Set(onSameDay.map((a) => (a.time || '').split(':')[0]));
    const blockedOnDay = blocked.filter((b) => b.date === date);
    blockedOnDay.forEach((b) => {
      const h = (b.time || '').split(':')[0];
      if (h) bookedHours.add(h);
    });
    const chosenHour = time.split(':')[0];
    if (bookedHours.has(chosenHour)) {
      setBookError('This time is not available (already booked or blocked). Please choose another.');
      return;
    }
    const fullAddress = [street.trim(), city.trim(), zip.trim()].filter(Boolean).join(', ');
    const result = await addAppointment({
      service: selected?.label ?? 'Exterior',
      price,
      date,
      time,
      address: fullAddress,
      vehicle: vehicle || 'Not specified',
      userName: name.trim(),
      userPhone: phone.trim(),
      userEmail: user?.email ?? '',
    });
    if (result?.backendId) {
      setBooked(true);
    } else {
      setBookError('Your appointment could not be saved. Please check your connection and try again, or call us to book.');
    }
  };

  const minBookableStr = getMinBookableDate().toISOString().slice(0, 10);

  return (
    <main className="page home">
      <section className="hero">
        <h1>We come to you.</h1>
        <p className="hero-sub">
          Mobile car detailing. Book a slot and we’ll show up at your place—exterior, interior, or both.
        </p>
        <Link to="/#book" className="btn-primary">Book an appointment</Link>
      </section>

      <section id="services" className="why">
        <h2>Why Double A Details</h2>
        <div className="why-grid">
          {WHY.map(({ title, desc, Icon }) => (
            <div key={title} className="why-item">
              <div className="icon-wrap">
                <Icon size={24} strokeWidth={1.75} aria-hidden />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="services">
        <h2>What we offer</h2>
        <div className="service-cards">
          {SERVICES_FOR_DISPLAY.map(({ name, price: p, desc, Icon }) => (
            <div key={name} className="service-card">
              <div className="icon-wrap">
                <Icon size={22} strokeWidth={1.75} aria-hidden />
              </div>
              <span className="service-name">{name}</span>
              <span className="service-price">${p}</span>
              <p className="service-desc">{desc}</p>
            </div>
          ))}
        </div>
        <p className="services-cta">
          <Link to="/signup">Create an account</Link> to get discounts on future bookings. Already have one? <Link to="/login">Log in</Link>.
        </p>
      </section>

      <section id="book" className="home-book-section">
        {booked ? (
          <div className="auth-card confirm-card home-book-card">
            <h2>Booked</h2>
            <p>Your appointment is set. We’ll see you then.</p>
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                <CalendarCheck size={20} aria-hidden /> View my appointments
              </Link>
            ) : (
              <Link to="/#book" className="btn-primary" onClick={() => setBooked(false)}>
                Book another
              </Link>
            )}
          </div>
        ) : (
          <div className="auth-card book-card home-book-card">
            <h2>Book an appointment</h2>
            <p className="book-discount-cta">
              No account needed. <Link to="/signup">Create an account</Link> to get discounts on future bookings.
            </p>
            <form onSubmit={handleSubmit}>
              {bookError && <p className="auth-error">{bookError}</p>}
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
                Your name
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                />
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  min={minBookableStr}
                />
              </label>
              <label className="book-time-label">
                Time
                {date && !isWeekday(date) && (
                  <span className="book-time-hint">Pick a weekday (Mon–Fri).</span>
                )}
              </label>
              {!date || !isWeekday(date) ? (
                <p className="book-time-pick-date">Pick a date above to see available times.</p>
              ) : (
                <div className="book-time-slots-wrap" role="group" aria-label="Choose a time">
                  {availabilityLoading ? (
                    <p className="book-time-loading">Checking availability…</p>
                  ) : (
                    BOOKING_HOURS.map((slotTime, index) => {
                      const hour = slotTime.split(':')[0];
                      const unavailable = unavailableHours.has(hour);
                      const isSelected = time === slotTime;
                      const showNotAvailable = unavailable;
                      return (
                        <button
                          key={slotTime}
                          type="button"
                          className={`book-time-slot ${isSelected ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}
                          onClick={() => handleTimeSelect(slotTime)}
                          disabled={unavailable}
                          title={showNotAvailable ? 'This time is not available' : undefined}
                          aria-pressed={isSelected}
                          aria-disabled={unavailable}
                          style={{ animationDelay: `${index * 0.04}s` }}
                        >
                          <span className="book-time-slot-label">{formatTimeLabel(slotTime)}</span>
                          {showNotAvailable && (
                            <span className="book-time-slot-unavailable">Not available</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              {date && !availabilityLoading && <input type="hidden" name="time" value={time} required readOnly aria-hidden />}
              <p className="book-rules">Mon–Fri only, at least 2 days ahead. We’re on jobs 6 AM–2 PM; book 2 PM–10 PM. One appointment per hour.</p>
              <label>
                Street address
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="123 Main St"
                  required
                />
              </label>
              <label>
                City
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Winter Park"
                  required
                />
              </label>
              <label>
                ZIP code
                <input
                  type="text"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  placeholder="32789"
                  required
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
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
              <button type="submit" className="btn-primary">Book appointment</button>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
