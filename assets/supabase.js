// ============================================
// ENTRE — Supabase Client
// ============================================

import { getConfig } from "./config.js";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = getConfig();

let supabase = null;

try {
  if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn("Supabase client não inicializado:", e);
}

export async function getSupabase() {
  if (!supabase) {
    console.warn("Supabase não configurado. Verifique assets/config.js");
  }
  return supabase;
}

export async function signIn(email, password) {
  const client = await getSupabase();
  if (!client) return { data: null, error: { message: "Supabase não configurado" } };
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { data, error };
}

export async function signUp(email, password, metadata = {}) {
  const client = await getSupabase();
  if (!client) return { data: null, error: { message: "Supabase não configurado" } };
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: { data: metadata }
  });
  return { data, error };
}

export async function signOut() {
  const client = await getSupabase();
  if (!client) return { error: { message: "Supabase não configurado" } };
  const { error } = await client.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const client = await getSupabase();
  if (!client) return { user: null, error: { message: "Supabase não configurado" } };
  const { data: { user } } = await client.auth.getUser();
  return { user, error: null };
}

export async function resetPassword(email) {
  const client = await getSupabase();
  if (!client) return { error: { message: "Supabase não configurado" } };
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`
  });
  return { data, error };
}
