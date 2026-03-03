import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { CalendarDays, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAppointmentsFromBackend } from '../lib/supabase';
import { Skeleton } from '../components/ui/Skeleton';
import { geocodeAppointments } from '../lib/geocode';
import 'leaflet/dist/leaflet.css';

const RED_ICON = new L.DivIcon({
  className: 'red-marker',
  html: '<div class="red-dot"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }, [map, points]);
  return null;
}

export default function Calendar() {
  const [appointments, setAppointments] = useState([]);
  const [withCoords, setWithCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await fetchAppointmentsFromBackend();
      if (cancelled) return;
      setAppointments(list);
      const withLatLng = await geocodeAppointments(list);
      if (cancelled) return;
      setWithCoords(withLatLng);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

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
    appointments.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    Object.keys(map).forEach((d) => map[d].sort((x, y) => (x.time || '').localeCompare(y.time || '')));
    return map;
  }, [appointments]);

  const monthLabel = useMemo(() => {
    return new Date(month.year, month.month).toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [month]);

  const prevMonth = () => {
    if (month.month === 0) setMonth({ year: month.year - 1, month: 11 });
    else setMonth({ ...month, month: month.month - 1 });
  };

  const nextMonth = () => {
    if (month.month === 11) setMonth({ year: month.year + 1, month: 0 });
    else setMonth({ ...month, month: month.month + 1 });
  };

  const defaultCenter = [39.8283, -98.5795];

  return (
    <main className="page calendar-page">
      <h1 className="calendar-title">
        <CalendarDays size={28} aria-hidden /> Calendar & map
      </h1>
      <p className="calendar-sub">All appointments from the backend. Red dots on the map are appointment addresses.</p>

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
          <section className="calendar-section">
            <div className="calendar-header">
              <button type="button" className="btn-ghost month-nav" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft size={24} />
              </button>
              <h2 className="calendar-month">{monthLabel}</h2>
              <button type="button" className="btn-ghost month-nav" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={24} />
              </button>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="calendar-weekday">
                  {d}
                </div>
              ))}
              {daysInMonth.map((cell, i) => {
                const list = cell.date ? appointmentsByDate[cell.date] || [] : [];
                return (
                  <div
                    key={i}
                    className={`calendar-day ${cell.current ? 'current' : 'other'} ${list.length > 0 ? 'has-appts' : ''}`}
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
                  </div>
                );
              })}
            </div>
          </section>

          <section className="map-section">
            <h2 className="map-title">
              <MapPin size={22} aria-hidden /> Map – appointment locations
            </h2>
            <div className="map-wrap">
              <MapContainer
                center={defaultCenter}
                zoom={4}
                className="map-container"
                scrollWheelZoom
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {withCoords.length > 0 && <FitBounds points={withCoords} />}
                {withCoords.map((a) => (
                  <Marker key={a.id} position={[a.lat, a.lng]} icon={RED_ICON}>
                    <Popup>
                      <strong>{a.date} {a.time}</strong>
                      <br />
                      {a.service} · ${a.price}
                      <br />
                      {a.userName && <>{a.userName}<br /></>}
                      {a.address}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
