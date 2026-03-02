import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Home, Wrench, Calendar, Shield, LayoutDashboard, LogIn, UserPlus, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src="/logo.png" alt="Double A Details — Mobile Car Detailing" className="logo-img" />
      </Link>
      <button
        type="button"
        className="menu-toggle"
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={menuOpen ? 'open' : ''}>
        <Link to="/" onClick={closeMenu}>
          <Home size={18} aria-hidden /> Home
        </Link>
        <Link to="/#services" onClick={closeMenu}>
          <Wrench size={18} aria-hidden /> Services
        </Link>
        <Link to="/#book" onClick={closeMenu}>
          <Calendar size={18} aria-hidden /> Book
        </Link>
        <Link to="/admin" onClick={closeMenu}>
          <Shield size={18} aria-hidden /> Admin
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" onClick={closeMenu}>
              <LayoutDashboard size={18} aria-hidden /> Dashboard
            </Link>
            <span className="user-name">{user.name}</span>
            <button type="button" className="btn-ghost" onClick={handleLogout}>
              <LogOut size={18} aria-hidden /> Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>
              <LogIn size={18} aria-hidden /> Log in
            </Link>
            <Link to="/signup" className="btn-nav" onClick={closeMenu}>
              <UserPlus size={18} aria-hidden /> Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
