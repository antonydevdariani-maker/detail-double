import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, Plus, XCircle } from 'lucide-react';
import { addBlockedSlotToBackend, removeBlockedSlotFromBackend } from '../../lib/supabase';

const SLOT_HOURS = ['15:30', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

function getMinDate() {
  return new Date().toISOString().slice(0, 10);
}

function formatSlotTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const min = m ? String(m).padStart(2, '0') : '00';
  return `${hour}:${min} ${period}`;
}

function formatSlotDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminAvailability() {
  const { blockedSlots, refetchBlockedSlots } = useOutletContext();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:30');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!date) {
      setError('Pick a date.');
      return;
    }
    setAdding(true);
    const id = await addBlockedSlotToBackend(date, time);
    setAdding(false);
    if (id) {
      await refetchBlockedSlots();
      setDate('');
      setTime('15:30');
    } else {
      setError('Could not block that slot. Try again.');
    }
  };

  const handleRemove = async (id) => {
    const ok = await removeBlockedSlotFromBackend(id);
    if (ok) await refetchBlockedSlots();
  };

  const sortedBlocked = [...blockedSlots].sort((a, b) => {
    if (a.date !== b.date) return (a.date || '').localeCompare(b.date || '');
    return (a.time || '').localeCompare(b.time || '');
  });

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Availability</h2>
      <p className="admin-section-desc">
        Block times when you&apos;re busy. Customers won&apos;t be able to book these slots on the public booking form.
      </p>

      <section className="admin-section admin-availability-section">
        <h3 className="admin-section-title">
          <Plus size={20} aria-hidden /> Block a time
        </h3>
        <form onSubmit={handleAdd} className="admin-availability-form">
          {error && <p className="auth-error">{error}</p>}
          <label>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={getMinDate()}
              required
            />
          </label>
          <label>
            Time (hour)
            <select value={time} onChange={(e) => setTime(e.target.value)}>
              {SLOT_HOURS.map((t) => (
                <option key={t} value={t}>{formatSlotTime(t)}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="btn-primary" disabled={adding}>
            <Clock size={18} /> Block this hour
          </button>
        </form>
      </section>

      <section className="admin-section admin-availability-section">
        <h3 className="admin-section-title">
          <Clock size={20} aria-hidden /> Blocked times
        </h3>
        {sortedBlocked.length === 0 ? (
          <p className="admin-bookings-empty">No blocked times. Add one above when you&apos;re busy.</p>
        ) : (
          <ul className="admin-blocked-list">
            {sortedBlocked.map((slot) => (
              <li key={slot.id} className="admin-blocked-item">
                <span className="admin-blocked-date">{formatSlotDate(slot.date)}</span>
                <span className="admin-blocked-time">{formatSlotTime(slot.time)}</span>
                <button
                  type="button"
                  className="btn-ghost admin-blocked-remove"
                  onClick={() => handleRemove(slot.id)}
                  title="Unblock this time"
                  aria-label="Unblock this time"
                >
                  <XCircle size={18} /> Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
