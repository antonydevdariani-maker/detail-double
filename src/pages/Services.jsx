import { Link } from 'react-router-dom';
import { MapPin, Sparkles, Clock, ShieldCheck, BadgeDollarSign } from 'lucide-react';
import { SERVICES_FOR_DISPLAY } from '../constants/services';

const WHY = [
  { title: 'We come to you', desc: 'No drop-off or wait. We detail at your home or office.', Icon: MapPin },
  { title: 'Pro-grade results', desc: 'Quality products and techniques for a showroom finish.', Icon: Sparkles },
  { title: 'Flexible scheduling', desc: 'Book a time that works. Easy to reschedule if needed.', Icon: Clock },
  { title: 'Trusted & reliable', desc: 'Consistent service and care for your vehicle every time.', Icon: ShieldCheck },
  { title: 'Clear pricing', desc: 'No hidden fees. You know the cost before we start.', Icon: BadgeDollarSign },
];

export default function Services() {
  return (
    <main className="page services-page">
      <section className="services-hero">
        <h1>Services</h1>
        <p className="services-hero-sub">Exterior, interior, or both. We come to you.</p>
      </section>

      <section className="why">
        <h2>Why Double A Details</h2>
        <div className="why-grid">
          {WHY.map(({ title, desc, Icon }) => (
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

      <section className="services">
        <h2>What we offer</h2>
        <div className="service-cards">
          {SERVICES_FOR_DISPLAY.map(({ name, price, desc, Icon }) => (
            <div key={name} className="service-card">
              <div className="icon-wrap">
                <Icon size={22} strokeWidth={1.75} aria-hidden />
              </div>
              <span className="service-name">{name}</span>
              <span className="service-price">${price}</span>
              <p className="service-desc">{desc}</p>
            </div>
          ))}
        </div>
        <p className="services-cta">
          <Link to="/book" className="btn-primary">Book an appointment</Link>
          {' · '}
          <Link to="/signup">Create an account</Link> to book. Already have one? <Link to="/login">Log in</Link>.
        </p>
      </section>
    </main>
  );
}
