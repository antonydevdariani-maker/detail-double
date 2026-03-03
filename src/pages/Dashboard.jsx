import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import BookingForm from '../components/BookingForm';
import { fireConfetti } from '../lib/confetti';

export default function Dashboard() {
  const [bookSuccess, setBookSuccess] = useState(false);

  const handleBookSuccess = () => {
    fireConfetti();
    setBookSuccess(true);
  };

  return (
    <div className="dashboard-content">
      <h2 className="dashboard-section-title">Book an appointment</h2>
      {bookSuccess ? (
        <div className="auth-card confirm-card dashboard-confirm">
          <p>Your appointment is set. We’ll see you then.</p>
          <button type="button" className="btn-primary" onClick={() => setBookSuccess(false)}>
            <Plus size={20} aria-hidden /> Book another
          </button>
        </div>
      ) : (
        <div className="auth-card book-card dashboard-book-card">
          <BookingForm
            showDiscountCta={false}
            onSuccess={handleBookSuccess}
          />
        </div>
      )}
    </div>
  );
}
