import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SERVICE_OPTIONS, ADD_ON_OPTIONS } from '../constants/services';
import {
  fetchAppointmentsFromBackend,
  fetchBlockedSlotsFromBackend,
  fetchCouponsByEmail,
  markCouponUsedInBackend,
} from '../lib/supabase';
import { Skeleton } from './ui/Skeleton';

export function getMinBookableDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() + 1);
  if (day === 6) d.setDate(d.getDate() + 2);
  return d;
}

export function isWeekday(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return day >= 1 && day <= 5;
}

const BOOKING_HOURS = ['15:30', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export function formatTimeLabel(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const min = m ? String(m).padStart(2, '0') : '00';
  return `${hour}:${min} ${period}`;
}

export default function BookingForm({ onSuccess, onError, showDiscountCta = true, compact = false }) {
  const { user, addAppointment } = useAuth();
  const [service, setService] = useState('regular');
  const [addOdorRemoval, setAddOdorRemoval] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('15:30');
  const [bookError, setBookError] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [zip, setZip] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [appointmentsForDate, setAppointmentsForDate] = useState([]);
  const [blockedForDate, setBlockedForDate] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [myCoupons, setMyCoupons] = useState([]);
  const [myCompletedCount, setMyCompletedCount] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const selected = SERVICE_OPTIONS.find((o) => o.id === service);
  const odorAddOn = ADD_ON_OPTIONS.find((o) => o.id === 'odor_removal');
  const basePrice = (selected?.price ?? 60) + (addOdorRemoval && odorAddOn ? odorAddOn.price : 0);

  const userEmail = (user?.email || '').trim().toLowerCase();
  useEffect(() => {
    if (!userEmail) return;
    Promise.all([
      fetchCouponsByEmail(userEmail),
      fetchAppointmentsFromBackend(),
    ]).then(([couponList, appointments]) => {
      setMyCoupons(Array.isArray(couponList) ? couponList : []);
      const mine = (appointments || []).filter(
        (a) => (a.userEmail || '').trim().toLowerCase() === userEmail
      );
      const completed = mine.filter((a) => a.completed && !a.cancelled).length;
      setMyCompletedCount(completed);
      const latest = mine.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.time || '').localeCompare(a.time || ''))[0];
      if (latest) {
        if ((latest.userName || '').trim()) setName((n) => n || (latest.userName || '').trim());
        if ((latest.userPhone || '').trim()) setPhone((p) => p || (latest.userPhone || '').trim());
      }
    }).catch(() => {
      setMyCoupons([]);
      setMyCompletedCount(0);
    });
  }, [userEmail]);

  const applicableCoupons = useMemo(() => {
    return myCoupons.filter((c) => {
      if (c.usedAt) return false;
      const min = c.minAppointments != null ? Number(c.minAppointments) : null;
      const unlocked = min == null || myCompletedCount >= min;
      if (!unlocked) return false;
      if (!c.serviceType) return true;
      return c.serviceType === service;
    });
  }, [myCoupons, myCompletedCount, service]);

  const { finalPrice, discountAmount } = useMemo(() => {
    if (!selectedCoupon) return { finalPrice: basePrice, discountAmount: 0 };
    const val = Number(selectedCoupon.discountValue) || 0;
    if (selectedCoupon.discountType === 'percent') {
      const amount = Math.round(basePrice * (val / 100));
      return { finalPrice: Math.max(0, basePrice - amount), discountAmount: amount };
    }
    return { finalPrice: Math.max(0, basePrice - val), discountAmount: val };
  }, [selectedCoupon, basePrice]);

  const price = finalPrice;

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

  useEffect(() => {
    if (!date || !time) return;
    const hour = time.split(':')[0];
    if (unavailableHours.has(hour)) {
      setTime(BOOKING_HOURS.find((t) => !unavailableHours.has(t.split(':')[0])) || '');
    }
  }, [date, unavailableHours]);

  useEffect(() => {
    if (user?.name && !name) setName(user.name);
  }, [user?.name]);

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
    if (!time || time < '15:30' || time > '22:00') {
      setBookError('Please select an available time (we’re available from 3:30 PM Mon–Fri).');
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
      service: (selected?.label ?? 'Regular package') + (addOdorRemoval ? ' + Odor removal' : ''),
      price: finalPrice,
      date,
      time,
      address: fullAddress,
      vehicle: vehicle || 'Not specified',
      userName: name.trim(),
      userPhone: phone.trim(),
      userEmail: user?.email ?? '',
    });
    if (result?.backendId) {
      if (selectedCoupon?.id) {
        await markCouponUsedInBackend(selectedCoupon.id);
      }
      onSuccess?.(result);
    } else {
      const err = 'Your appointment could not be saved. Please check your connection and try again, or call us to book.';
      setBookError(err);
      onError?.(err);
    }
  };

  const minBookableStr = getMinBookableDate().toISOString().slice(0, 10);

  return (
    <form onSubmit={handleSubmit} className={compact ? 'booking-form compact' : 'booking-form'}>
      {bookError && <p className="auth-error">{bookError}</p>}
      <label className="service-label">Package</label>
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
              {opt.description && <span className="service-opt-desc">{opt.description}</span>}
            </button>
          );
        })}
      </div>
      <div className="service-addons">
        <p className="service-addons-title">Add-ons</p>
        {ADD_ON_OPTIONS.map((addon) => {
          const Icon = addon.Icon;
          const isChecked = addon.id === 'odor_removal' && addOdorRemoval;
          return (
            <label
              key={addon.id}
              className={`service-addon-opt ${isChecked ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setAddOdorRemoval(e.target.checked)}
                className="service-addon-input"
              />
              <span className="service-addon-icon" aria-hidden>
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <span className="service-addon-content">
                <span className="service-addon-label-text">{addon.label}</span>
                {addon.description && <span className="service-addon-desc">{addon.description}</span>}
                <span className="service-addon-price">+${addon.price}</span>
              </span>
            </label>
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
            <div className="book-time-slots-skeleton" aria-busy="true" aria-label="Loading times">
              {BOOKING_HOURS.map((_, i) => (
                <Skeleton key={i} className="book-time-slot-skeleton" />
              ))}
            </div>
          ) : (
            BOOKING_HOURS.map((slotTime, index) => {
              const hour = slotTime.split(':')[0];
              const unavailable = unavailableHours.has(hour);
              const isSelected = time === slotTime;
              return (
                <button
                  key={slotTime}
                  type="button"
                  className={`book-time-slot ${isSelected ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}
                  onClick={() => handleTimeSelect(slotTime)}
                  disabled={unavailable}
                  title={unavailable ? 'This time is not available' : undefined}
                  aria-pressed={isSelected}
                  aria-disabled={unavailable}
                  style={{ animationDelay: `${index * 0.04}s` }}
                >
                  <span className="book-time-slot-label">{formatTimeLabel(slotTime)}</span>
                  {unavailable && (
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
      {user && applicableCoupons.length > 0 && (
        <div className="book-discount-apply">
          <span className="book-discount-apply-label">Apply a discount (unlocked coupons)</span>
          <div className="book-discount-apply-buttons" role="group" aria-label="Choose a coupon">
            <button
              type="button"
              className={`book-discount-apply-btn ${!selectedCoupon ? 'selected' : ''}`}
              onClick={() => setSelectedCoupon(null)}
              aria-pressed={!selectedCoupon}
            >
              None
            </button>
            {applicableCoupons.map((c) => {
              const label = c.discountType === 'percent'
                ? `${c.discountValue}% off`
                : `$${c.discountValue} off`;
              const isSelected = selectedCoupon?.id === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`book-discount-apply-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCoupon(isSelected ? null : c)}
                  aria-pressed={isSelected}
                  title={c.description || label}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <p className="book-total">
        Total: ${price}
        {discountAmount > 0 && (
          <span className="book-total-discount"> (discount applied: −${discountAmount})</span>
        )}
      </p>
      {showDiscountCta && (
        <p className="book-discount-cta">
          <Link to="/signup">Create an account</Link> to get discounts on future bookings.
        </p>
      )}
      <button type="submit" className="btn-primary">Book appointment</button>
    </form>
  );
}
