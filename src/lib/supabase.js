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

// ——— Customer coupons (admin gives out; customers see in Dashboard Discounts) ———

const COUPONS_STORAGE_KEY = 'doublea_customer_coupons';

function getCouponsFromStorage() {
  try {
    const raw = localStorage.getItem(COUPONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function setCouponsInStorage(list) {
  try {
    localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(list));
  } catch (_) {}
}

function rowToCoupon(row) {
  if (!row) return null;
  return {
    id: row.id,
    userEmail: row.user_email,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    description: row.description,
    serviceType: row.service_type || null,
    minAppointments: row.min_appointments ?? null,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

export async function fetchCouponsByEmail(email) {
  if (!email?.trim()) return [];
  const key = email.trim().toLowerCase();
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('customer_coupons')
        .select('id, user_email, discount_type, discount_value, description, service_type, min_appointments, created_at, used_at')
        .eq('user_email', key)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToCoupon);
    } catch (e) {
      const msg = e?.message || '';
      if (msg.includes('service_type') || msg.includes('min_appointments') || msg.includes('column')) {
        try {
          const { data, error } = await client
            .from('customer_coupons')
            .select('id, user_email, discount_type, discount_value, description, created_at, used_at')
            .eq('user_email', key)
            .order('created_at', { ascending: false });
          if (error) throw error;
          return (data || []).map((row) => rowToCoupon({ ...row, service_type: null, min_appointments: null }));
        } catch (_) {}
      }
      console.warn('Supabase fetch coupons failed, using local storage:', msg);
    }
  }
  const list = getCouponsFromStorage().filter((c) => (c.user_email || c.userEmail || '').toLowerCase() === key);
  return list.map((c) => ({
    id: c.id,
    userEmail: c.user_email || c.userEmail,
    discountType: c.discount_type || c.discountType,
    discountValue: c.discount_value ?? c.discountValue,
    description: c.description,
    serviceType: c.service_type ?? c.serviceType ?? null,
    minAppointments: c.min_appointments ?? c.minAppointments ?? null,
    createdAt: c.created_at ?? c.createdAt,
    usedAt: c.used_at ?? c.usedAt,
  }));
}

export async function createCouponInBackend({ userEmail, discountType, discountValue, description, serviceType, minAppointments }) {
  if (!userEmail?.trim() || !discountType || !discountValue) return null;
  const email = userEmail.trim().toLowerCase();
  const value = Math.abs(Number(discountValue)) || 0;
  const desc = description?.trim() || null;
  const validService = serviceType && ['regular', 'full', 'exterior', 'interior', 'both'].includes(serviceType) ? serviceType : null;
  const minAppt = minAppointments != null && Number(minAppointments) > 0 ? Math.floor(Number(minAppointments)) : null;

  const client = getSupabase();
  if (client) {
    const tryInsert = async (row) => {
      const { data, error } = await client.from('customer_coupons').insert(row).select('id').single();
      if (error) throw error;
      return data?.id ?? null;
    };
    try {
      const id = await tryInsert({
        user_email: email,
        discount_type: discountType,
        discount_value: value,
        description: desc,
        service_type: validService,
        min_appointments: minAppt,
      });
      if (id) return id;
    } catch (e1) {
      try {
        const id = await tryInsert({
          user_email: email,
          discount_type: discountType,
          discount_value: value,
          description: desc,
        });
        if (id) return id;
      } catch (e2) {
        console.warn('Supabase create coupon failed, using local storage:', e1?.message || e2?.message);
      }
    }
  }

  const id = crypto.randomUUID();
  const list = getCouponsFromStorage();
  list.push({
    id,
    user_email: email,
    discount_type: discountType,
    discount_value: value,
    description: desc,
    service_type: validService,
    min_appointments: minAppt,
    created_at: new Date().toISOString(),
    used_at: null,
  });
  setCouponsInStorage(list);
  return id;
}

export async function deleteCouponInBackend(couponId) {
  if (!couponId) return false;
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client.from('customer_coupons').delete().eq('id', couponId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase delete coupon failed, trying local storage:', e?.message);
    }
  }
  const list = getCouponsFromStorage().filter((c) => c.id !== couponId);
  setCouponsInStorage(list);
  return true;
}

export async function markCouponUsedInBackend(couponId) {
  if (!couponId) return false;
  const client = getSupabase();
  if (client) {
    try {
      const { error } = await client
        .from('customer_coupons')
        .update({ used_at: new Date().toISOString() })
        .eq('id', couponId);
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn('Supabase mark coupon used failed, trying local storage:', e?.message);
    }
  }
  const list = getCouponsFromStorage();
  const idx = list.findIndex((c) => c.id === couponId);
  if (idx === -1) return false;
  list[idx] = { ...list[idx], used_at: new Date().toISOString() };
  setCouponsInStorage(list);
  return true;
}

export async function fetchAllCouponsFromBackend() {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client
        .from('customer_coupons')
        .select('id, user_email, discount_type, discount_value, description, service_type, min_appointments, created_at, used_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(rowToCoupon);
    } catch (e) {
      try {
        const { data, error } = await client
          .from('customer_coupons')
          .select('id, user_email, discount_type, discount_value, description, created_at, used_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map((row) => rowToCoupon({ ...row, service_type: null, min_appointments: null }));
      } catch (_) {
        console.warn('Supabase fetch all coupons failed, using local storage:', e?.message);
      }
    }
  }
  const list = getCouponsFromStorage();
  return list
    .map((c) => ({
      id: c.id,
      userEmail: c.user_email || c.userEmail,
      discountType: c.discount_type || c.discountType,
      discountValue: c.discount_value ?? c.discountValue,
      description: c.description,
      serviceType: c.service_type ?? c.serviceType ?? null,
      minAppointments: c.min_appointments ?? c.minAppointments ?? null,
      createdAt: c.created_at ?? c.createdAt,
      usedAt: c.used_at ?? c.usedAt,
    }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

