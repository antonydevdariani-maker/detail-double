import { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Phone,
  User,
  X,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import 'leaflet/dist/leaflet.css';

const WINTER_PARK_CENTER = [28.6001, -81.3392];
const WINTER_PARK_BOUNDS = L.latLngBounds(
  [28.55, -81.45],
  [28.65, -81.25]
);

const RED_ICON = new L.DivIcon({
  className: 'red-marker',
  html: '<div class="red-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  return date.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function AdminCalendar() {
  const { appointments, withCoords, loading, handleMarkDone, handleCancel } = useOutletContext();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const activeAppointments = useMemo(
    () => appointments.filter((a) => !a.cancelled && !a.completed),
    [appointments]
  );

  const daysInMonth = useMemo(() => {
    const start = new Date(month.year, month.month, 1);
    const end = new Date(month.year, month.month + 1, 0);
    const firstDay = start.getDay();
    const days = end.getDate();
    const prevMonth = new Date(month.year, month.month, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: prevMonth - firstDay + i + 1, current: false, date: null });
    }
    for (let d = 1; d <= days; d++) {
      const dateStr = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      grid.push({ day: d, current: true, date: dateStr });
    }
    const remaining = 42 - grid.length;
    for (let r = 1; r <= remaining; r++) {
      grid.push({ day: r, current: false, date: null });
    }
    return grid;
  }, [month.year, month.month]);

  const appointmentsByDate = useMemo(() => {
    const map = {};
    activeAppointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.keys(map).forEach((d) => map[d].sort((x, y) => (x.time || '').localeCompare(y.time || '')));
    return map;
  }, [activeAppointments]);

  const monthLabel = useMemo(
    () => new Date(month.year, month.month).toLocaleString('default', { month: 'long', year: 'numeric' }),
    [month]
  );

  const selectedDayAppointments = useMemo(() => {
    if (!selectedDate) return [];
    return (appointmentsByDate[selectedDate] || []).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [selectedDate, appointmentsByDate]);

  const prevMonth = () => {
    if (month.month === 0) setMonth({ year: month.year - 1, month: 11 });
    else setMonth({ ...month, month: month.month - 1 });
  };

  const nextMonth = () => {
    if (month.month === 11) setMonth({ year: month.year + 1, month: 0 });
    else setMonth({ ...month, month: month.month + 1 });
  };

  return (
    <div className="admin-dashboard-content">
      <h2 className="admin-page-title">Calendar</h2>

      {loading ? (
        <div className="admin-calendar-skeleton" aria-busy="true" aria-label="Loading calendar">
          <div className="calendar-header">
            <Skeleton className="calendar-nav-skeleton" />
            <Skeleton className="calendar-month-skeleton" />
            <Skeleton className="calendar-nav-skeleton" />
          </div>
          <div className="calendar-grid calendar-grid-skeleton">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="calendar-weekday">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="calendar-day-skeleton" />
            ))}
          </div>
          <Skeleton className="admin-calendar-map-skeleton" />
        </div>
      ) : (
        <>
          <section className="admin-section calendar-section">
            <div className="calendar-header">
              <button type="button" className="btn-ghost month-nav" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft size={24} />
              </button>
              <h3 className="calendar-month">{monthLabel}</h3>
              <button type="button" className="btn-ghost month-nav" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="calendar-weekday">{d}</div>
              ))}
              {daysInMonth.map((cell, i) => {
                const list = cell.date ? appointmentsByDate[cell.date] || [] : [];
                return (
                  <button
                    key={i}
                    type="button"
                    className={`calendar-day ${cell.current ? 'current' : 'other'} ${list.length > 0 ? 'has-appts clickable' : ''}`}
                    onClick={list.length > 0 ? () => setSelectedDate(cell.date) : undefined}
                    disabled={list.length === 0}
                  >
                    <span className="calendar-day-num">{cell.day}</span>
                    {list.length > 0 && (
                      <ul className="calendar-day-list">
                        {list.slice(0, 3).map((a) => (
                          <li key={a.id}>
                            {a.time} – {a.service} {a.address ? `@ ${a.address.slice(0, 20)}…` : ''}
                          </li>
                        ))}
                        {list.length > 3 && <li className="more">+{list.length - 3} more</li>}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="admin-calendar-map-wrap">
              <h3 className="map-title">
                <MapPin size={20} aria-hidden /> Map – Winter Park, FL
              </h3>
              <div className="map-wrap map-wrap--admin">
                <MapContainer
                  center={WINTER_PARK_CENTER}
                  zoom={13}
                  className="map-container"
                  scrollWheelZoom
                  maxBounds={WINTER_PARK_BOUNDS}
                  maxBoundsViscosity={1}
                  minZoom={12}
                  maxZoom={18}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />
                  {withCoords.filter((a) => !a.cancelled && !a.completed).map((a) => (
                    <Marker key={a.id} position={[a.lat, a.lng]} icon={RED_ICON}>
                      <Popup className="admin-map-popup">
                        <div className="admin-popup-content">
                          <span className="admin-popup-time">{a.date} · {a.time}</span>
                          <span className="admin-popup-service">{a.service} — ${a.price}</span>
                          {a.userName && <span className="admin-popup-name">{a.userName}</span>}
                          {a.userPhone && <span className="admin-popup-phone">{a.userPhone}</span>}
                          <span className="admin-popup-address">{a.address}</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </section>

          {selectedDate && (
            <div className="admin-day-modal-overlay" onClick={() => setSelectedDate(null)}>
              <div className="admin-day-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-day-modal-header">
                  <h3>Appointments for {formatDisplayDate(selectedDate)}</h3>
                  <button type="button" className="btn-ghost admin-day-modal-close" onClick={() => setSelectedDate(null)} aria-label="Close">
                    <X size={22} />
                  </button>
                </div>
                <ul className="admin-day-modal-list">
                  {selectedDayAppointments.map((a) => (
                    <li key={a.id} className="admin-day-modal-item">
                      <div className="admin-day-modal-block">
                        <span className="admin-day-modal-block-label">Time</span>
                        <span className="admin-day-modal-time">{a.time}</span>
                      </div>
                      <div className="admin-day-modal-block">
                        <span className="admin-day-modal-block-label">Package</span>
                        <span className="admin-day-modal-package">{a.service} — ${a.price}</span>
                      </div>
                      <div className="admin-day-modal-block">
                        <span className="admin-day-modal-block-label">Customer</span>
                        <span className="admin-day-modal-name">{a.userName ? <><User size={16} aria-hidden /> {a.userName}</> : '—'}</span>
                      </div>
                      {a.userPhone && (
                        <div className="admin-day-modal-block">
                          <span className="admin-day-modal-block-label">Phone</span>
                          <a href={`tel:${a.userPhone.replace(/\D/g, '')}`} className="admin-day-modal-phone">
                            <Phone size={16} aria-hidden /> {a.userPhone}
                          </a>
                        </div>
                      )}
                      <div className="admin-day-modal-block">
                        <span className="admin-day-modal-block-label">Address</span>
                        <span className="admin-day-modal-address">{a.address}</span>
                      </div>
                      <div className="admin-day-modal-actions">
                        <button
                          type="button"
                          className="btn-ghost admin-day-done"
                          onClick={() => { handleMarkDone(a.id); setSelectedDate(null); }}
                          disabled={a.completed}
                          title="Mark as done"
                        >
                          <CheckCircle size={18} /> {a.completed ? 'Done' : 'Mark done'}
                        </button>
                        <button
                          type="button"
                          className="btn-ghost admin-day-cancel"
                          onClick={() => { handleCancel(a.id); setSelectedDate(null); }}
                          disabled={a.cancelled}
                          title="Cancel"
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
        </>
      )}
    </div>
  );
}
