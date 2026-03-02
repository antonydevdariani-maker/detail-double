import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { CalendarCheck, XCircle } from 'lucide-react';

export default function AdminPastAppointments() {
  const { appointments, loading, handleCancel } = useOutletContext();

  const pastAppointments = useMemo(() => {
    return appointments
      .filter((a) => a.completed && !a.cancelled)
      .sort((a, b) =>
        a.date === b.date
          ? (a.time || '').localeCompare(b.time || '')
          : (b.date || '').localeCompare(a.date || '')
      );
  }, [appointments]);

  const totalFromPast = useMemo(
    () => pastAppointments.reduce((sum, a) => sum + (Number(a.price) || 0), 0),
    [pastAppointments]
  );

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Past appointments</h2>
      <p className="admin-section-desc">
        Completed jobs that count toward your revenue. Cancelling one removes it from revenue.
      </p>

      {loading ? (
        <p className="calendar-loading">Loading…</p>
      ) : (
        <section className="admin-section admin-bookings-section">
          {pastAppointments.length > 0 ? (
            <div className="admin-bookings-subsection">
              <h3 className="admin-section-title">
                <CalendarCheck size={20} aria-hidden /> Completed ({pastAppointments.length})
              </h3>
              {totalFromPast > 0 && (
                <p className="admin-section-desc">
                  Total from these: <strong>${totalFromPast.toLocaleString()}</strong>
                </p>
              )}
              <div className="admin-contacts-card admin-contacts-card--previous">
                <div className="admin-contacts-header">
                  <span className="admin-contact-check-col" aria-hidden>✓</span>
                  <span>Name</span>
                  <span>Phone</span>
                  <span>Package</span>
                  <span>Date</span>
                  <span>Time</span>
                  <span className="admin-contact-amount">Amount</span>
                  <span className="admin-contact-actions-head">Cancel</span>
                </div>
                <ul className="admin-contacts-list">
                  {pastAppointments.map((a) => (
                    <li key={a.id} className="admin-contact-row admin-contact-row--previous">
                      <span className="admin-contact-check-col">
                        <CalendarCheck size={18} className="admin-row-check" aria-hidden />
                      </span>
                      <span className="admin-contact-name">{a.userName || '—'}</span>
                      <a
                        href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined}
                        className="admin-contact-phone"
                      >
                        {a.userPhone || '—'}
                      </a>
                      <span className="admin-contact-package">{a.service || '—'}</span>
                      <span className="admin-contact-date">{a.date}</span>
                      <span className="admin-contact-time">{a.time}</span>
                      <span className="admin-contact-amount">${a.price}</span>
                      <div className="admin-contact-actions">
                        <button
                          type="button"
                          className="btn-ghost admin-contact-cancel"
                          onClick={() => handleCancel(a.id)}
                          title="Cancel — removes this from revenue"
                          aria-label="Cancel this appointment (removes from revenue)"
                        >
                          <XCircle size={18} /> Cancel
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="admin-bookings-empty">No past appointments. Completed jobs will appear here and count toward revenue until you cancel them.</p>
          )}
        </section>
      )}
    </div>
  );
}
