import { useState, useEffect, useMemo, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Tag, Gift, Mail, Users, CheckCircle, XCircle } from 'lucide-react';
import { createCouponInBackend, fetchAllCouponsFromBackend, deleteCouponInBackend, isSupabaseConfigured } from '../../lib/supabase';

export default function AdminCoupons() {
  const { appointments } = useOutletContext();
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(true);
  const issuedSectionRef = useRef(null);
  const [minAppointments, setMinAppointments] = useState('5');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [grantError, setGrantError] = useState('');
  const [grantSuccess, setGrantSuccess] = useState('');
  const [granting, setGranting] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  const completedByEmail = useMemo(() => {
    const map = new Map();
    const completed = appointments
      .filter((a) => a.completed && !a.cancelled && (a.userEmail || '').trim())
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));
    completed.forEach((a) => {
      const e = (a.userEmail || '').trim().toLowerCase();
      const name = (a.userName || '').trim() || '—';
      const phone = (a.userPhone || '').trim() || '—';
      if (!map.has(e)) map.set(e, { email: e, name, phone, count: 0 });
      map.get(e).count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [appointments]);

  const emailToPhone = useMemo(() => {
    const map = new Map();
    const byDate = [...appointments].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''));
    byDate.forEach((a) => {
      const e = (a.userEmail || '').trim().toLowerCase();
      if (e && !map.has(e) && (a.userPhone || '').trim()) map.set(e, (a.userPhone || '').trim());
    });
    return map;
  }, [appointments]);

  const allCustomerEmails = useMemo(() => {
    const set = new Set();
    appointments
      .filter((a) => (a.userEmail || '').trim())
      .forEach((a) => set.add((a.userEmail || '').trim().toLowerCase()));
    return Array.from(set);
  }, [appointments]);

  useEffect(() => {
    setCouponsLoading(true);
    fetchAllCouponsFromBackend()
      .then(setCoupons)
      .finally(() => setCouponsLoading(false));
  }, []);

  const handleGrantToEligible = async (e) => {
    e.preventDefault();
    setGrantError('');
    setGrantSuccess('');
    const n = Math.max(1, Math.floor(Number(minAppointments)) || 1);
    const val = Math.abs(Number(discountValue)) || 0;
    if (val <= 0) {
      setGrantError('Enter a valid discount value.');
      return;
    }
    if (discountType === 'percent' && val > 100) {
      setGrantError('Percent cannot exceed 100.');
      return;
    }
    const desc = (description || '').trim() || `After ${n} appointments`;
    const alreadyHasThisDescription = new Set(
      coupons
        .filter((c) => (c.description || '').trim() === desc)
        .map((c) => c.userEmail)
    );
    if (allCustomerEmails.length === 0) {
      setGrantError('No customers to assign to. Customers are added when someone books an appointment (with an email). Book a test appointment first, then assign coupons.');
      return;
    }
    const toCreate = allCustomerEmails.filter((email) => !alreadyHasThisDescription.has(email));
    if (toCreate.length === 0) {
      setGrantSuccess('Every customer already has this coupon. No new coupons created.');
      return;
    }
    setGranting(true);
    let created = 0;
    for (const email of toCreate) {
      const id = await createCouponInBackend({
        userEmail: email,
        discountType,
        discountValue: val,
        description: desc,
        serviceType: serviceType || null,
        minAppointments: n,
      });
      if (id) created++;
    }
    setGranting(false);
    if (created > 0) {
      setGrantSuccess(`Assigned this coupon to ${created} customer${created !== 1 ? 's' : ''}. They will see it in their dashboard under Discounts (unlocks after ${n} completed appointments). See Issued coupons below.`);
      const updated = await fetchAllCouponsFromBackend();
      setCoupons(updated);
      setTimeout(() => issuedSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    } else {
      setGrantError('Coupons could not be created. Check that Supabase is configured (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env), the customer_coupons table exists (run your Supabase migrations), and check the browser console for errors.');
    }
  };

  const minNum = Math.max(1, Math.floor(Number(minAppointments)) || 1);
  const newCustomerCount = useMemo(
    () => {
      const desc = (description || '').trim() || `After ${minNum} appointments`;
      const alreadyHas = new Set(
        coupons.filter((c) => (c.description || '').trim() === desc).map((c) => c.userEmail)
      );
      return allCustomerEmails.filter((email) => !alreadyHas.has(email)).length;
    },
    [allCustomerEmails, coupons, minAppointments, description, minNum]
  );

  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Coupons</h2>
      {!supabaseConfigured && (
        <div className="admin-coupons-supabase-info" role="status">
          Supabase is not configured. Coupons are saved in this browser only. To sync across devices and keep coupons in a database, add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and run the customer_coupons migration.
        </div>
      )}
      <p className="admin-section-desc">
        Assign a coupon to every customer. They see it in their dashboard and how close they are; they can use it only after they complete the number of appointments you set. They’ll see it in Dashboard → Discounts.
      </p>

      <section className="admin-section admin-coupons-give-section">
        <h3 className="admin-section-title">
          <Gift size={20} aria-hidden /> Assign coupon to every customer
        </h3>
        <p className="admin-section-desc">
          Give this discount to every customer once they have the number of completed appointments you set below. Click the button to grant to everyone who qualifies and doesn’t already have this coupon.
        </p>
        <form onSubmit={handleGrantToEligible} className="admin-coupons-form">
          {grantError && <p className="auth-error">{grantError}</p>}
          {grantSuccess && (
            <div className="admin-coupons-assigned-banner" role="alert">
              <CheckCircle size={24} aria-hidden />
              <div>
                <strong>Coupons assigned</strong>
                <p className="admin-coupons-assigned-text">{grantSuccess}</p>
              </div>
            </div>
          )}
          <label>
            Unlocks after this many completed appointments (customer can use it then)
            <input
              type="number"
              min={1}
              max={999}
              value={minAppointments}
              onChange={(e) => setMinAppointments(e.target.value)}
              placeholder="5"
            />
          </label>
          <div className="admin-coupons-row">
            <label>
              Discount type
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount off ($)</option>
              </select>
            </label>
            <label>
              Value
              <input
                type="number"
                min={1}
                max={discountType === 'percent' ? 100 : 999}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? '10' : '15'}
              />
            </label>
          </div>
          <label>
            Applies to (type of appointment)
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option value="">Any service</option>
              <option value="regular">Regular package only</option>
              <option value="full">Full detail only</option>
            </select>
          </label>
          <label>
            Description (shown to customer; also used so we don’t grant twice)
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`e.g. After ${minNum} appointments reward`}
            />
          </label>
          <p className="admin-coupons-eligible">
            <Users size={18} aria-hidden /> {newCustomerCount} customer{newCustomerCount !== 1 ? 's' : ''} would get this coupon right now (have {minNum}+ completed and don’t already have it).
          </p>
          <button type="submit" className="btn-primary" disabled={granting || newCustomerCount === 0 || allCustomerEmails.length === 0}>
            <Tag size={18} aria-hidden /> {granting ? 'Assigning…' : 'Assign to all customers'}
          </button>
        </form>
      </section>

      <section className="admin-section admin-coupons-section">
        <h3 className="admin-section-title">
          <Mail size={20} aria-hidden /> Customers by completed appointments
        </h3>
        <p className="admin-section-desc">
          See who has how many completed jobs. Use the form above to grant a coupon to everyone who reaches a number you choose.
        </p>
        {completedByEmail.length === 0 ? (
          <p className="admin-bookings-empty">No completed appointments yet.</p>
        ) : (
          <div className="admin-contacts-card">
            <div className="admin-contacts-header admin-coupons-customer-header">
              <span>Email</span>
              <span>Name</span>
              <span>Phone</span>
              <span className="admin-contact-amount">Completed</span>
            </div>
            <ul className="admin-contacts-list">
              {completedByEmail.map(({ email: e, name, phone, count }) => (
                <li key={e} className="admin-contact-row admin-coupons-customer-row">
                  <span className="admin-contact-name">{e}</span>
                  <span className="admin-contact-name">{name}</span>
                  <span className="admin-contact-phone-wrap">
                    {phone !== '—' ? (
                      <a href={`tel:${phone.replace(/\D/g, '')}`} className="admin-contact-phone">{phone}</a>
                    ) : (
                      '—'
                    )}
                  </span>
                  <span className="admin-contact-amount">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="admin-section" ref={issuedSectionRef} id="issued-coupons">
        <h3 className="admin-section-title">Issued coupons ({coupons.length})</h3>
        <p className="admin-section-desc">Cancel a coupon to revoke it; the customer will no longer see it in their dashboard.</p>
        {couponsLoading ? (
          <p className="calendar-loading">Loading…</p>
        ) : coupons.length === 0 ? (
          <p className="admin-bookings-empty">No coupons issued yet.</p>
        ) : (
          <div className="admin-contacts-card admin-contacts-card--previous">
            <div className="admin-contacts-header admin-coupons-issued-header">
              <span>Email</span>
              <span>Phone</span>
              <span>Discount</span>
              <span>Applies to</span>
              <span>Unlocks after</span>
              <span>Description</span>
              <span>Created</span>
              <span className="admin-contact-actions-head">Cancel</span>
            </div>
            <ul className="admin-contacts-list">
              {coupons.map((c) => (
                <li
                  key={c.id}
                  className={`admin-contact-row admin-contact-row--previous ${cancellingId === c.id ? 'admin-contact-row--cancelling' : ''}`}
                >
                  <span className="admin-contact-name">{c.userEmail}</span>
                  <span className="admin-contact-phone-wrap">
                    {emailToPhone.get((c.userEmail || '').trim().toLowerCase()) ? (
                      <a href={`tel:${(emailToPhone.get((c.userEmail || '').trim().toLowerCase()) || '').replace(/\D/g, '')}`} className="admin-contact-phone">
                        {emailToPhone.get((c.userEmail || '').trim().toLowerCase())}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                  <span className="admin-contact-amount">
                    {c.discountType === 'percent' ? `${c.discountValue}% off` : `$${c.discountValue} off`}
                  </span>
                  <span className="admin-coupons-desc">
                    {c.serviceType === 'regular' ? 'Regular' : c.serviceType === 'full' ? 'Full detail' : 'Any'}
                  </span>
                  <span className="admin-coupons-desc">{c.minAppointments != null ? `${c.minAppointments} appts` : '—'}</span>
                  <span className="admin-coupons-desc">{c.description || '—'}</span>
                  <span className="admin-contact-date">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                  </span>
                  <div className="admin-contact-actions">
                    <button
                      type="button"
                      className="btn-ghost admin-contact-cancel"
                      disabled={cancellingId !== null}
                      onClick={async () => {
                        if (window.confirm(`Revoke this coupon for ${c.userEmail}? They will no longer see it.`)) {
                          setCancellingId(c.id);
                          await new Promise((r) => setTimeout(r, 420));
                          const ok = await deleteCouponInBackend(c.id);
                          if (ok) {
                            const updated = await fetchAllCouponsFromBackend();
                            setCoupons(updated);
                          }
                          setCancellingId(null);
                        }
                      }}
                      title="Revoke this coupon"
                      aria-label={`Cancel coupon for ${c.userEmail}`}
                    >
                      <XCircle size={18} aria-hidden /> Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
