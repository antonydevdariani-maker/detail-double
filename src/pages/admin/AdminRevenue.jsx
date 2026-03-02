import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { DollarSign } from 'lucide-react';

export default function AdminRevenue() {
  const { appointments } = useOutletContext();

  const revenue = useMemo(
    () => appointments
      .filter((a) => a.completed && !a.cancelled)
      .reduce((sum, a) => sum + (Number(a.price) || 0), 0),
    [appointments]
  );

  const completedCount = useMemo(
    () => appointments.filter((a) => a.completed && !a.cancelled).length,
    [appointments]
  );

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Revenue</h2>
      <section className="admin-section admin-revenue-section">
        <div className="admin-revenue-card admin-revenue-card--large">
          <DollarSign size={40} aria-hidden className="admin-revenue-icon" />
          <div>
            <span className="admin-revenue-label">Total from completed jobs</span>
            <span className="admin-revenue-value">${revenue.toLocaleString()}</span>
            <span className="admin-revenue-meta">{completedCount} job{completedCount !== 1 ? 's' : ''} completed</span>
          </div>
        </div>
      </section>
    </div>
  );
}
