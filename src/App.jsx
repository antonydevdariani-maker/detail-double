import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminBookings from './pages/admin/AdminBookings';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminAvailability from './pages/admin/AdminAvailability';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/book" element={<Home />} />
            <Route path="/services" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="availability" element={<AdminAvailability />} />
            </Route>
            <Route path="/calendar" element={<Navigate to="/admin/calendar" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
