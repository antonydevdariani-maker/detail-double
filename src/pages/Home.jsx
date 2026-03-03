import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Sparkles,
  Clock,
  CalendarCheck,
  Instagram,
  PhoneCall,
} from 'lucide-react';
import { SERVICES_FOR_DISPLAY } from '../constants/services';
import BookingForm from '../components/BookingForm';
import { fireConfetti } from '../lib/confetti';

const INSTAGRAM_URL = 'https://www.instagram.com/double_a_detailz?igsh=MWZja200a2h6amFnZg%3D%3D&utm_source=qr';
const PHONE_RAW = '8139542241';
const PHONE_PRETTY = '(813) 954-2241';
const PHONE2_RAW = '4074843571';
const PHONE2_PRETTY = '(407) 484-3571';

const WHY_TOP = [
  { title: 'We come to you', desc: 'No drop-off or wait. We detail at your home or office.', Icon: MapPin },
  { title: 'Pro-grade results', desc: 'Quality products and techniques for a showroom finish.', Icon: Sparkles },
  { title: 'Flexible scheduling', desc: 'Book a time that works. Easy to reschedule if needed.', Icon: Clock },
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
        <div className="why-social">
          <a
            className="btn-ghost why-social-link"
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="Open Instagram"
          >
            <Instagram size={18} aria-hidden />
            Instagram
          </a>
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
                onSuccess={() => {
                  fireConfetti();
                  setBooked(true);
                }}
              />
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

      <section className="home-contact">
        <div className="auth-card home-contact-card">
          <h2>Contact us</h2>
          <p className="home-contact-sub">
            Call or text us to ask questions, get a quote, or book over the phone.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a className="btn-primary" href={`tel:${PHONE_RAW}`} aria-label={`Call ${PHONE_PRETTY}`}>
              <PhoneCall size={18} aria-hidden /> {PHONE_PRETTY}
            </a>
            <a className="btn-primary" href={`tel:${PHONE2_RAW}`} aria-label={`Call ${PHONE2_PRETTY}`}>
              <PhoneCall size={18} aria-hidden /> {PHONE2_PRETTY}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
