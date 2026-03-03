import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Phone, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

function getThreeDaysAgoStr() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 3);
  return d.toISOString().slice(0, 10);
}

export default function AdminBookings() {
  const { appointments, loading, handleMarkDone, handleCancel } = useOutletContext();

  const scheduledAppointments = useMemo(
    () => appointments.filter((a) => !a.completed && !a.cancelled),
    [appointments]
  );
  const previousDetailsAppointments = useMemo(() => {
    const cutoff = getThreeDaysAgoStr();
    return appointments
      .filter((a) => a.completed && !a.cancelled && a.date <= cutoff)
      .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (b.date || '').localeCompare(a.date || '')));
  }, [appointments]);
  const cancelledAppointments = useMemo(
    () => appointments
      .filter((a) => a.cancelled)
      .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (b.date || '').localeCompare(a.date || ''))),
    [appointments]
  );

  const sortedScheduled = useMemo(
    () => [...scheduledAppointments].sort((a, b) =>
      a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (a.date || '').localeCompare(b.date || '')
    ),
    [scheduledAppointments]
  );

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Bookings</h2>
      <p className="admin-section-desc">All appointments from the booking form appear here. Mark done or cancel as needed.</p>

      {loading ? (
        <div className="admin-bookings-skeleton" aria-busy="true" aria-label="Loading bookings">
          <Skeleton className="admin-skeleton-title" />
          <Skeleton className="admin-skeleton-desc" />
          <div className="admin-contacts-card">
            <div className="admin-contacts-header">
              <span>Name</span><span>Phone</span><span>Package</span><span>Date</span><span>Time</span><span></span>
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-contact-row admin-contact-row-skeleton">
                <Skeleton className="admin-contact-skeleton-cell" />
                <Skeleton className="admin-contact-skeleton-cell" />
                <Skeleton className="admin-contact-skeleton-cell" />
                <Skeleton className="admin-contact-skeleton-cell" />
                <Skeleton className="admin-contact-skeleton-cell" />
                <Skeleton className="admin-contact-skeleton-actions" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <section className="admin-section admin-bookings-section">
          {sortedScheduled.length > 0 && (
            <div className="admin-bookings-subsection">
              <h3 className="admin-section-title">
                <Phone size={20} aria-hidden /> Scheduled
              </h3>
              <div className="admin-contacts-card">
                <div className="admin-contacts-header">
                  <span>Name</span>
                  <span>Phone</span>
                  <span>Package</span>
                  <span>Date</span>
                  <span>Time</span>
                  <span className="admin-contact-actions-head">Done / Cancel</span>
                </div>
                <ul className="admin-contacts-list">
                  {sortedScheduled.map((a) => (
                    <li key={a.id} className="admin-contact-row">
                      <span className="admin-contact-name">{a.userName || '—'}</span>
                      <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
                        {a.userPhone || '—'}
                      </a>
                      <span className="admin-contact-package">{a.service || '—'}</span>
                      <span className="admin-contact-date">{a.date}</span>
                      <span className="admin-contact-time">{a.time}</span>
                      <div className="admin-contact-actions">
                        <button
                          type="button"
                          className="btn-ghost admin-contact-done"
                          onClick={() => handleMarkDone(a.id)}
                          title="Mark as done"
                          aria-label={`Mark ${a.userName || 'appointment'} as done`}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost admin-contact-cancel"
                          onClick={() => handleCancel(a.id)}
                          title="Cancel appointment"
                          aria-label="Cancel appointment"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {previousDetailsAppointments.length > 0 && (
            <div className="admin-bookings-subsection">
              <h3 className="admin-section-title">
                <CheckCircle size={20} aria-hidden /> Previous details
              </h3>
              <p className="admin-section-desc">Completed jobs (shown 3+ days after the appointment date). Revenue is added from these. Cancel if you marked one done by mistake.</p>
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
                  {previousDetailsAppointments.map((a) => (
                    <li key={a.id} className="admin-contact-row admin-contact-row--previous">
                      <span className="admin-contact-check-col">
                        <CheckCircle size={18} className="admin-row-check" aria-hidden />
                      </span>
                      <span className="admin-contact-name">{a.userName || '—'}</span>
                      <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
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
                          title="Cancel (e.g. if marked done by mistake)"
                          aria-label="Cancel this appointment"
                        >
                          <XCircle size={18} /> Cancel
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {cancelledAppointments.length > 0 && (
            <div className="admin-bookings-subsection">
              <h3 className="admin-section-title">
                <XCircle size={20} aria-hidden /> Cancelled
              </h3>
              <div className="admin-contacts-card admin-contacts-card--cancelled">
                <div className="admin-contacts-header">
                  <span>Name</span>
                  <span>Phone</span>
                  <span>Package</span>
                  <span>Date</span>
                  <span>Time</span>
                </div>
                <ul className="admin-contacts-list">
                  {cancelledAppointments.map((a) => (
                    <li key={a.id} className="admin-contact-row admin-contact-row--cancelled">
                      <span className="admin-contact-name">{a.userName || '—'}</span>
                      <a href={a.userPhone ? `tel:${a.userPhone.replace(/\D/g, '')}` : undefined} className="admin-contact-phone">
                        {a.userPhone || '—'}
                      </a>
                      <span className="admin-contact-package">{a.service || '—'}</span>
                      <span className="admin-contact-date">{a.date}</span>
                      <span className="admin-contact-time">{a.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {sortedScheduled.length === 0 && previousDetailsAppointments.length === 0 && cancelledAppointments.length === 0 && (
            <p className="admin-bookings-empty">No bookings yet.</p>
          )}
        </section>
      )}
    </div>
  );
}
