import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Sparkles,
  Clock,
  ShieldCheck,
  BadgeDollarSign,
  CalendarCheck,
} from 'lucide-react';
import { SERVICES_FOR_DISPLAY } from '../constants/services';
import BookingForm from '../components/BookingForm';

const WHY_TOP = [
  { title: 'We come to you', desc: 'No drop-off or wait. We detail at your home or office.', Icon: MapPin },
  { title: 'Pro-grade results', desc: 'Quality products and techniques for a showroom finish.', Icon: Sparkles },
  { title: 'Flexible scheduling', desc: 'Book a time that works. Easy to reschedule if needed.', Icon: Clock },
];

const WHY_BELOW_BOOK = [
  { title: 'Trusted & reliable', desc: 'Consistent service and care for your vehicle every time.', Icon: ShieldCheck },
  { title: 'Clear pricing', desc: 'No hidden fees. You know the cost before we start.', Icon: BadgeDollarSign },
  { title: 'Satisfaction guaranteed', desc: 'We stand behind our work. Your car, done right.', Icon: Sparkles },
];

export default function Home() {
  const { user } = useAuth();
  const location = useLocation();
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    const hash = location.hash?.slice(1);
    const path = location.pathname;
    const target = hash === 'services' || hash === 'book' ? hash : path === '/services' ? 'services' : path === '/book' ? 'book' : null;
    if (target) {
      const el = document.getElementById(target);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash, location.pathname]);

  return (
    <main className="page home">
      <section className="hero">
        <p className="hero-name">Double A Details</p>
        <h1>We come to you.</h1>
        <p className="hero-sub">
          Mobile car detailing. Book a slot and we’ll show up at your place—Regular package, Full detail, and add-ons like odor removal.
        </p>
        <Link to="/#book" className="btn-primary">Book an appointment</Link>
      </section>

      <section className="why">
        <h2>Why Double A Details</h2>
        <div className="why-grid why-grid--three">
          {WHY_TOP.map(({ title, desc, Icon }) => (
            <div key={title} className="why-item">
              <div className="icon-wrap">
                <Icon size={24} strokeWidth={1.75} aria-hidden />
              </div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="book" className="home-book-section">
        {booked ? (
          <div className="auth-card confirm-card home-book-card">
            <h2>Booked</h2>
            <p>Your appointment is set. We’ll see you then.</p>
            {user ? (
              <Link to="/dashboard" className="btn-primary">
                <CalendarCheck size={20} aria-hidden /> View my appointments
              </Link>
            ) : (
              <Link to="/#book" className="btn-primary" onClick={() => setBooked(false)}>
                Book another
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="auth-card book-card home-book-card">
              <h2>Book an appointment</h2>
              <p className="book-discount-cta">
                No account needed. <Link to="/signup">Create an account</Link> to get discounts on future bookings.
              </p>
              <BookingForm
                showDiscountCta={false}
                onSuccess={() => setBooked(true)}
              />
            </div>
            <div className="why-below-book">
              <div className="why-grid why-grid--three">
                {WHY_BELOW_BOOK.map(({ title, desc, Icon }) => (
                  <div key={title} className="why-item">
                    <div className="icon-wrap">
                      <Icon size={24} strokeWidth={1.75} aria-hidden />
                    </div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <section id="services" className="services">
        <h2>What we offer</h2>
        <div className="service-cards">
          {SERVICES_FOR_DISPLAY.map(({ name, price: p, desc, Icon }) => (
            <div key={name} className="service-card">
              <div className="icon-wrap">
                <Icon size={18} strokeWidth={1.75} aria-hidden />
              </div>
              <span className="service-name">{name}</span>
              <span className="service-price">${p}</span>
              <p className="service-desc">{desc}</p>
            </div>
          ))}
        </div>
        <p className="services-cta">
          <Link to="/signup">Create an account</Link> to get discounts on future bookings. Already have one? <Link to="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}
