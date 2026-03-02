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
  if (!client) {
    console.warn('Supabase not configured (missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
    return null;
  }

  const baseRow = {
    user_name: (appt.userName ?? '').trim() || null,
    user_email: (appt.userEmail ?? '').trim() || null,
    user_phone: (appt.userPhone ?? appt.phone ?? '').trim() || null,
    address: String(appt.address ?? '').trim() || null,
    date: String(appt.date ?? '').trim(),
    time: String(appt.time ?? '').trim(),
    service: String(appt.service ?? '').trim(),
    price: Math.round(Number(appt.price)) || 0,
    vehicle: (appt.vehicle ?? '').trim() || null,
  };

  if (!baseRow.date || !baseRow.time || !baseRow.service) {
    console.warn('Supabase save failed: missing date, time, or service');
    return null;
  }

  if (!baseRow.address) {
    console.warn('Supabase save failed: address is required');
    return null;
  }

  try {
    const { data, error } = await client
      .from('appointments')
      .insert({
        ...baseRow,
        completed: false,
        cancelled: false,
      })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    const msg = e?.message || '';
    if (msg.includes('column') || msg.includes('user_phone') || msg.includes('completed') || msg.includes('cancelled')) {
      try {
        const { data, error } = await client
          .from('appointments')
          .insert({
            user_name: baseRow.user_name,
            user_email: baseRow.user_email,
            address: baseRow.address,
            date: baseRow.date,
            time: baseRow.time,
            service: baseRow.service,
            price: baseRow.price,
            vehicle: baseRow.vehicle,
          })
          .select('id')
          .single();
        if (error) throw error;
        return data?.id ?? null;
      } catch (e2) {
        console.warn('Supabase save failed (fallback):', e2?.message);
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

// ——— Blocked slots (admin "I'm busy" — customers can't book these times) ———

export async function fetchBlockedSlotsFromBackend() {
  const client = getSupabase();
  if (!client) return [];
  try {
    const { data, error } = await client
      .from('blocked_slots')
      .select('id, date, time')
      .order('date', { ascending: true })
      .order('time', { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({ id: row.id, date: row.date, time: row.time }));
  } catch (e) {
    console.warn('Supabase fetch blocked_slots failed:', e?.message);
    return [];
  }
}

export async function addBlockedSlotToBackend(date, time) {
  const client = getSupabase();
  if (!client || !date || !time) return null;
  try {
    const { data, error } = await client
      .from('blocked_slots')
      .insert({ date, time })
      .select('id')
      .single();
    if (error) throw error;
    return data?.id ?? null;
  } catch (e) {
    console.warn('Supabase add blocked_slot failed:', e?.message);
    return null;
  }
}

export async function removeBlockedSlotFromBackend(id) {
  const client = getSupabase();
  if (!client || !id) return false;
  try {
    const { error } = await client.from('blocked_slots').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Supabase remove blocked_slot failed:', e?.message);
    return false;
  }
}

