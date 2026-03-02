import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Tag, Lock, CheckCircle, Gift, RefreshCw } from 'lucide-react';
import { fetchCouponsByEmail, fetchAppointmentsFromBackend } from '../lib/supabase';

function CouponCard({ c, completedCount, showProgress }) {
  const serviceLabel = c.serviceType === 'regular' ? 'Regular package' : c.serviceType === 'full' ? 'Full detail' : 'any service';
  const min = c.minAppointments != null ? Number(c.minAppointments) : null;
  const unlocked = min == null || completedCount >= min;
  const needed = min != null && !unlocked ? min - completedCount : 0;

  return (
    <li className={`dashboard-coupon-card ${unlocked ? 'dashboard-coupon-card--unlocked' : 'dashboard-coupon-card--locked'}`}>
      <div className="dashboard-coupon-head">
        <span className="dashboard-coupon-value">
          {c.discountType === 'percent' ? `${c.discountValue}% off` : `$${c.discountValue} off`}
          <span className="dashboard-coupon-service"> {serviceLabel}</span>
        </span>
        {unlocked && !c.usedAt && (
          <span className="dashboard-coupon-badge dashboard-coupon-badge--unlocked">
            <CheckCircle size={16} aria-hidden /> Use at checkout
          </span>
        )}
        {c.usedAt && (
          <span className="dashboard-coupon-used">Used</span>
        )}
      </div>
      {c.description && (
        <span className="dashboard-coupon-desc">{c.description}</span>
      )}
      {showProgress && min != null && (
        <p className="dashboard-coupon-progress">
          {unlocked ? (
            <>You've completed {completedCount}/{min} appointments. You can use this discount.</>
          ) : (
            <>{completedCount}/{min} completed — {needed} more to unlock</>
          )}
        </p>
      )}
    </li>
  );
}

export default function DashboardDiscounts() {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userEmail = (user?.email || '').trim().toLowerCase();

  const loadDiscounts = useCallback(() => {
    if (!userEmail) return;
    setError(null);
    setLoading(true);
    Promise.all([
      fetchCouponsByEmail(userEmail),
      fetchAppointmentsFromBackend(),
    ])
      .then(([couponList, appointments]) => {
        setCoupons(Array.isArray(couponList) ? couponList : []);
        const myCompleted = (appointments || []).filter(
          (a) => (a.userEmail || '').trim().toLowerCase() === userEmail && a.completed && !a.cancelled
        ).length;
        setCompletedCount(myCompleted);
      })
      .catch((err) => {
        console.warn('Dashboard discounts load failed:', err);
        setError('Could not load your discounts. Check your connection and try again.');
        setCoupons([]);
      })
      .finally(() => setLoading(false));
  }, [userEmail]);

  useEffect(() => {
    loadDiscounts();
  }, [loadDiscounts]);

  const { eligible, notYet } = useMemo(() => {
    const eligibleList = [];
    const notYetList = [];
    coupons.forEach((c) => {
      const min = c.minAppointments != null ? Number(c.minAppointments) : null;
      const unlocked = min == null || completedCount >= min;
      if (unlocked) {
        eligibleList.push(c);
      } else {
        notYetList.push(c);
      }
    });
    return { eligible: eligibleList, notYet: notYetList };
  }, [coupons, completedCount]);

  return (
    <div className="dashboard-content">
      <div className="dashboard-discounts-header">
        <h2 className="dashboard-section-title">
          <Tag size={22} aria-hidden /> Discounts
        </h2>
        <button
          type="button"
          className="btn-ghost dashboard-discounts-refresh"
          onClick={loadDiscounts}
          disabled={loading}
          aria-label="Refresh discounts"
        >
          <RefreshCw size={18} className={loading ? 'spin' : ''} aria-hidden /> Refresh
        </button>
      </div>
      {error && (
        <div className="dashboard-discounts-error">
          <p>{error}</p>
          <button type="button" className="btn-primary" onClick={loadDiscounts}>
            Try again
          </button>
        </div>
      )}
      {!error && loading ? (
        <p className="dashboard-loading">Loading discounts…</p>
      ) : !error && coupons.length === 0 ? (
        <div className="dashboard-discounts-empty">
          <p>You don't have any coupons yet.</p>
          <p className="dashboard-hint">Complete appointments to become eligible for rewards—we sometimes give coupons after 5 completed jobs.</p>
        </div>
      ) : !error ? (
        <>
          <section className="dashboard-discounts-section">
            <h3 className="dashboard-discounts-subtitle">
              <Gift size={20} aria-hidden /> Eligible — discounts you can use
            </h3>
            {eligible.length === 0 ? (
              <p className="dashboard-discounts-empty-sub">No discounts ready to use yet. Complete more appointments to unlock coupons below.</p>
            ) : (
              <ul className="dashboard-coupons-list">
                {eligible.map((c) => (
                  <CouponCard key={c.id} c={c} completedCount={completedCount} showProgress />
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-discounts-section">
            <h3 className="dashboard-discounts-subtitle">
              <Lock size={20} aria-hidden /> Not yet — coupons you can unlock
            </h3>
            {notYet.length === 0 ? (
              <p className="dashboard-discounts-empty-sub">You've unlocked all your coupons. Keep completing appointments to earn more.</p>
            ) : (
              <ul className="dashboard-coupons-list">
                {notYet.map((c) => (
                  <CouponCard key={c.id} c={c} completedCount={completedCount} showProgress />
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
