import { createContext, useContext, useState, useEffect } from 'react';
import { saveAppointmentToBackend, updateAppointmentInBackend } from '../lib/supabase';

const STORAGE_KEY = 'doublea_user';
const APPOINTMENTS_KEY = 'doublea_appointments';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {}
    }
    const storedAppts = localStorage.getItem(APPOINTMENTS_KEY);
    if (storedAppts) {
      try {
        setAppointments(JSON.parse(storedAppts));
      } catch (_) {}
    }
  }, []);

  const login = (email, password) => {
    const allUsers = JSON.parse(localStorage.getItem('doublea_users') || '[]');
    const emailLower = (email || '').trim().toLowerCase();
    const found = allUsers.find(u => (u.email || '').toLowerCase() === emailLower && u.password === password);
    if (!found) return false;
    const { password: _, ...safe } = found;
    safe.email = emailLower;
    setUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  };

  const signup = (email, password, name) => {
    const allUsers = JSON.parse(localStorage.getItem('doublea_users') || '[]');
    const emailLower = (email || '').trim().toLowerCase();
    if (allUsers.some(u => (u.email || '').toLowerCase() === emailLower)) return false;
    const newUser = { id: crypto.randomUUID(), email: emailLower, password, name: (name || '').trim() };
    allUsers.push(newUser);
    localStorage.setItem('doublea_users', JSON.stringify(allUsers));
    const { password: _, ...safe } = newUser;
    setUser(safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addAppointment = async (appt) => {
    const payload = {
      service: appt.service,
      price: appt.price,
      date: appt.date,
      time: appt.time,
      address: appt.address,
      vehicle: appt.vehicle,
      userName: appt.userName ?? user?.name ?? '',
      userEmail: appt.userEmail ?? user?.email ?? '',
      userPhone: appt.userPhone ?? appt.phone ?? '',
    };
    const backendId = await saveAppointmentToBackend(payload).catch(() => null);

    if (user) {
      const newAppt = {
        id: crypto.randomUUID(),
        userId: user.id,
        backendId: backendId || null,
        ...appt,
      };
      const next = [...appointments, newAppt];
      setAppointments(next);
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next));
      return newAppt;
    }
    return { id: null, backendId: backendId, ...appt };
  };

  const cancelAppointment = async (id) => {
    const appt = appointments.find(a => a.id === id);
    if (appt?.backendId) {
      await updateAppointmentInBackend(appt.backendId, { cancelled: true }).catch(() => {});
    }
    const next = appointments.filter(a => a.id !== id);
    setAppointments(next);
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(next));
  };

  const userAppointments = appointments.filter(a => a.userId === user?.id);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        addAppointment,
        cancelAppointment,
        userAppointments,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
