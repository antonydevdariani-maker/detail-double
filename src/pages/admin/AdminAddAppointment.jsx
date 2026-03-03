import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarPlus, User, Phone, MapPin, Wind } from 'lucide-react';
import { SERVICE_OPTIONS, ADD_ON_OPTIONS } from '../../constants/services';
import { saveAppointmentToBackend, fetchAppointmentsFromBackend, fetchBlockedSlotsFromBackend } from '../../lib/supabase';
import { getMinBookableDate, isWeekday, formatTimeLabel } from '../../components/BookingForm';
import { fireConfetti } from '../../lib/confetti';

const SLOT_HOURS = ['15:30', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function AdminAddAppointment() {
  const { refetchAppointments } = useOutletContext();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('regular');
  const [addOdorRemoval, setAddOdorRemoval] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:30');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selected = SERVICE_OPTIONS.find((o) => o.id === service);
  const odorAddOn = ADD_ON_OPTIONS.find((o) => o.id === 'odor_removal');
  const basePrice = (selected?.price ?? 60) + (addOdorRemoval && odorAddOn ? odorAddOn.price : 0);
  const price = priceOverride.trim() ? Math.round(Number(priceOverride)) : basePrice;
  const minDateStr = getMinBookableDate().toISOString().slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    const emailTrim = (email || '').trim().toLowerCase();
    const nameTrim = (name || '').trim();
    const phoneTrim = (phone || '').trim();
    const address = [street.trim(), city.trim(), zip.trim()].filter(Boolean).join(', ');

    if (!nameTrim) {
      setError('Enter the customer\'s name.');
      return;
    }
    if (!emailTrim) {
      setError('Enter the customer\'s email.');
      return;
    }
    if (!date || !isWeekday(date)) {
      setError('Pick a weekday (Mon–Fri).');
      return;
    }
    if (!time || time < '15:30' || time > '22:00') {
      setError('Pick a time from 3:30 PM onward.');
      return;
    }
    if (!address) {
      setError('Enter the address (at least one of street, city, or zip).');
      return;
    }

    setSubmitting(true);
    const [existing, blocked] = await Promise.all([
      fetchAppointmentsFromBackend(),
      fetchBlockedSlotsFromBackend(),
    ]).catch(() => [[], []]);
    const onDay = existing.filter((a) => a.date === date && !a.cancelled);
    const bookedHours = new Set(onDay.map((a) => (a.time || '').split(':')[0]));
    blocked.filter((b) => b.date === date).forEach((b) => {
      const h = (b.time || '').split(':')[0];
      if (h) bookedHours.add(h);
    });
    const chosenHour = time.split(':')[0];
    if (bookedHours.has(chosenHour)) {
      setError('That date and time is already booked or blocked. Choose another.');
      setSubmitting(false);
      return;
    }

    const payload = {
      userName: nameTrim,
      userEmail: emailTrim,
      userPhone: phoneTrim,
      address,
      date,
      time,
      service: (selected?.label ?? 'Regular package') + (addOdorRemoval ? ' + Odor removal' : ''),
      price: Math.max(0, price),
      vehicle: (vehicle || '').trim() || 'Not specified',
    };
    const id = await saveAppointmentToBackend(payload);
    setSubmitting(false);
    if (id) {
      fireConfetti();
      await refetchAppointments();
      setSuccess(`Appointment added for ${nameTrim} on ${date} at ${formatTimeLabel(time)}. It will appear in Bookings and Calendar.`);
      setName('');
      setEmail('');
      setPhone('');
      setStreet('');
      setCity('');
      setZip('');
      setVehicle('');
      setPriceOverride('');
      setDate('');
      setTime('15:30');
    } else {
      setError('Could not save the appointment. Check that the address is filled and Supabase is configured.');
    }
  };

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">
        <CalendarPlus size={24} aria-hidden /> Add appointment
      </h2>
      <p className="admin-section-desc">
        Add an appointment when someone books over the phone or in person without an account. It’s saved like a normal booking and shows in Bookings, Calendar, and Past appointments once completed.
      </p>

      <section className="admin-section admin-add-appointment-section">
        <form onSubmit={handleSubmit} className="admin-add-appointment-form">
          {error && <p className="auth-error">{error}</p>}
          {success && <p className="admin-add-appointment-success" role="status">{success}</p>}

          <div className="admin-add-appointment-fields">
            <label className="admin-add-appointment-field">
              <User size={18} aria-hidden /> Customer name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                required
              />
            </label>
            <label className="admin-add-appointment-field">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </label>
            <label className="admin-add-appointment-field">
              <Phone size={18} aria-hidden /> Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </label>
            <label className="admin-add-appointment-field">
              Package
              <select value={service} onChange={(e) => setService(e.target.value)}>
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label} — ${opt.price}</option>
                ))}
              </select>
            </label>
            <label className="admin-add-appointment-field admin-add-appointment-addon">
              <span className="admin-addon-icon" aria-hidden>
                <Wind size={18} strokeWidth={1.75} />
              </span>
              <input
                type="checkbox"
                checked={addOdorRemoval}
                onChange={(e) => setAddOdorRemoval(e.target.checked)}
              />
              <span>Odor removal +$20</span>
            </label>
            <label className="admin-add-appointment-field">
              Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDateStr}
                required
              />
            </label>
            <label className="admin-add-appointment-field">
              Time
              <select value={time} onChange={(e) => setTime(e.target.value)}>
                {SLOT_HOURS.map((t) => (
                  <option key={t} value={t}>{formatTimeLabel(t)}</option>
                ))}
              </select>
            </label>
            <label className="admin-add-appointment-field">
              <MapPin size={18} aria-hidden /> Street
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="123 Main St"
              />
            </label>
            <label className="admin-add-appointment-field">
              City
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City"
              />
            </label>
            <label className="admin-add-appointment-field">
              ZIP
              <input
                type="text"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="12345"
              />
            </label>
            <label className="admin-add-appointment-field">
              Vehicle (optional)
              <input
                type="text"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="e.g. 2020 Honda Civic"
              />
            </label>
            <label className="admin-add-appointment-field">
              Price ($)
              <input
                type="number"
                min={0}
                value={priceOverride}
                onChange={(e) => setPriceOverride(e.target.value)}
                placeholder={String(basePrice)}
              />
            </label>
          </div>

          {date && !isWeekday(date) && (
            <p className="auth-error">Pick a weekday (Mon–Fri). We’re available 3:30 PM onward.</p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            <CalendarPlus size={18} aria-hidden /> {submitting ? 'Adding…' : 'Add appointment'}
          </button>
        </form>
      </section>
    </div>
  );
}
