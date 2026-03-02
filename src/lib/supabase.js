import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

export function getSupabase() {
  if (!url || !anonKey) return null;
  if (!supabase) {
    supabase = createClient(url, anonKey);
  }
  return supabase;
}

export function isSupabaseConfigured() {
  return Boolean(url && anonKey);
}

export async function saveAppointmentToBackend(appt) {
  const client = getSupabase();
  if (!client) return null;

  const baseRow = {
    user_name: appt.userName ?? null,
    user_email: appt.userEmail ?? null,
    address: appt.address,
    date: appt.date,
    time: appt.time,
    service: appt.service,
    price: appt.price,
    vehicle: appt.vehicle || null,
  };

  try {
    const { data, error } = await client
      .from('appointments')
      .insert({
        ...baseRow,
        user_phone: appt.userPhone ?? appt.phone ?? null,
        completed: false,
        cancelled: false,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    const msg = e?.message || '';
    if (msg.includes('user_phone') || msg.includes('column')) {
      try {
        const { data, error } = await client
          .from('appointments')
          .insert({ ...baseRow, completed: false, cancelled: false })
          .select('id')
          .single();
        if (error) throw error;
        return data?.id ?? null;
      } catch (e2) {
        console.warn('Supabase save failed:', e2?.message);
        return null;
      }
    }
    console.warn('Supabase save failed:', msg);
    return null;
  }
}

function rowToAppointment(row) {
  if (!row) return null;
  return {
    id: row.id,
    userName: row.user_name,
    userEmail: row.user_email,
    userPhone: row.user_phone,
    address: row.address,
    date: row.date,
    time: row.time,
    service: row.service,
    price: row.price,
    vehicle: row.vehicle,
    completed: row.completed === true,
    cancelled: row.cancelled === true,
  };
}

export async function fetchAppointmentsFromBackend() {
  const client = getSupabase();
  if (!client) return [];
  try {
    let data, error;
    const withPhone = await client
      .from('appointments')
      .select('id, user_name, user_email, user_phone, address, date, time, service, price, vehicle, completed, cancelled')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (withPhone.error && (withPhone.error.message?.includes('user_phone') || withPhone.error.message?.includes('column'))) {
      const withoutPhone = await client
        .from('appointments')
        .select('id, user_name, user_email, address, date, time, service, price, vehicle, completed, cancelled')
        .order('date', { ascending: true })
        .order('time', { ascending: true });
      data = withoutPhone.data;
      error = withoutPhone.error;
    } else {
      data = withPhone.data;
      error = withPhone.error;
    }
    if (error) throw error;
    const list = (data || []).map((row) => rowToAppointment({ ...row, completed: row.completed === true, cancelled: row.cancelled === true }));
    return list.sort((a, b) =>
      a.date === b.date
        ? (a.time || '').localeCompare(b.time || '')
        : (a.date || '').localeCompare(b.date || '')
    );
  } catch (e) {
    const msg = e?.message || '';
    if (msg.includes('completed') || msg.includes('cancelled')) {
      try {
        const fallback = await client
          .from('appointments')
          .select('id, user_name, user_email, user_phone, address, date, time, service, price, vehicle')
          .order('date', { ascending: true })
          .order('time', { ascending: true });
        if (fallback.error) throw fallback.error;
        const list = (fallback.data || []).map((row) => rowToAppointment({ ...row, completed: false, cancelled: false }));
        return list.sort((a, b) =>
          a.date === b.date ? (a.time || '').localeCompare(b.time || '') : (a.date || '').localeCompare(b.date || '')
        );
      } catch (_) {}
    }
    console.warn('Supabase fetch failed:', msg);
    return [];
  }
}

export async function updateAppointmentInBackend(id, updates) {
  const client = getSupabase();
  if (!client || !id) return false;
  try {
    const row = {};
    if (updates.completed !== undefined) row.completed = updates.completed;
    if (updates.cancelled !== undefined) row.cancelled = updates.cancelled;
    const { error } = await client.from('appointments').update(row).eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Supabase update failed:', e?.message);
    return false;
  }
}

