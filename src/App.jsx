import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './pages/DashboardLayout';
import Dashboard from './pages/Dashboard';
import DashboardAppointments from './pages/DashboardAppointments';
import DashboardPastAppointments from './pages/DashboardPastAppointments';
import DashboardDiscounts from './pages/DashboardDiscounts';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRevenue from './pages/admin/AdminRevenue';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPastAppointments from './pages/admin/AdminPastAppointments';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminAddAppointment from './pages/admin/AdminAddAppointment';
import AdminAvailability from './pages/admin/AdminAvailability';
import HoverButtonDemo from './components/ui/hover-button-demo';
import NeonButtonDemo from './pages/NeonButtonDemo';
import DockDemo from './pages/DockDemo';

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
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<DashboardAppointments />} />
              <Route path="past-appointments" element={<DashboardPastAppointments />} />
              <Route path="discounts" element={<DashboardDiscounts />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="revenue" element={<AdminRevenue />} />
              <Route path="bookings" element={<AdminBookings />} />
              <Route path="past-appointments" element={<AdminPastAppointments />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="add-appointment" element={<AdminAddAppointment />} />
              <Route path="availability" element={<AdminAvailability />} />
            </Route>
            <Route path="/calendar" element={<Navigate to="/admin/calendar" replace />} />
            <Route path="/hover-demo" element={<HoverButtonDemo />} />
            <Route path="/neon-demo" element={<NeonButtonDemo />} />
            <Route path="/dock-demo" element={<DockDemo />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
