import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!signup(email, password, name)) {
      setError('An account with this email already exists.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>Sign up</h1>
        <form onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn-primary">Create account</button>
        </form>
        <p className="auth-swap">Already have an account? <Link to="/login">Log in</Link></p>
        <p className="auth-dashboard-hint">After signing in, view your appointments and discounts in your dashboard.</p>
      </div>
    </main>
  );
}
