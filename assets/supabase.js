// ============================================
// ENTRE — Supabase Client (Global)
// ============================================

function ensureSupabaseSDK() {
  if (window.supabase && typeof window.supabase.createClient === "function") {
    return window.supabase;
  }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
  script.async = false;
  document.head.appendChild(script);

  return new Promise((resolve, reject) => {
    const check = () => {
      if (window.supabase && typeof window.supabase.createClient === "function") {
        resolve(window.supabase);
      } else {
        setTimeout(check, 50);
      }
    };
    script.onload = check;
    script.onerror = () => reject(new Error("Falha ao carregar SDK do Supabase"));
    check();
  });
}

(async function initSupabase() {
  try {
    const sdk = await ensureSupabaseSDK();
    const url = window.ENTRE_CONFIG.SUPABASE_URL;
    const key = window.ENTRE_CONFIG.SUPABASE_ANON_KEY;
    window.supabaseClient = sdk.createClient(url, key);

    window.getSupabase = async function() {
      return window.supabaseClient;
    };

    window.signIn = async function(email, password) {
      if (!window.supabaseClient) return { data: null, error: { message: "Supabase não configurado" } };
      const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
      return { data, error };
    };

    window.signUp = async function(email, password, metadata = {}) {
      if (!window.supabaseClient) return { data: null, error: { message: "Supabase não configurado" } };
      const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      return { data, error };
    };

    window.signOut = async function() {
      if (!window.supabaseClient) return { error: { message: "Supabase não configurado" } };
      const { error } = await window.supabaseClient.auth.signOut();
      return { error };
    };

    window.getCurrentUser = async function() {
      if (!window.supabaseClient) return { user: null, error: { message: "Supabase não configurado" } };
      const { data: { user } } = await window.supabaseClient.auth.getUser();
      return { user, error: null };
    };

    window.resetPassword = async function(email) {
      if (!window.supabaseClient) return { error: { message: "Supabase não configurado" } };
      const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/redefinir-senha.html"
      });
      return { data, error };
    };

    window.forgotPassword = async function(email) {
      if (!email || !email.trim()) {
        return { data: null, error: { message: "Informe um e-mail válido." } };
      }
      return window.resetPassword(email.trim());
    };

    window.updatePassword = async function(newPassword) {
      if (!window.supabaseClient) return { error: { message: "Supabase não configurado" } };
      if (!newPassword || newPassword.length < 6) {
        return { error: { message: "A senha deve ter pelo menos 6 caracteres." } };
      }
      const { data, error } = await window.supabaseClient.auth.updateUser({
        password: newPassword
      });
      return { data, error };
    };

    console.log("Supabase client inicializado com sucesso");
  } catch (e) {
    console.error("Supabase client init error:", e);
    window.signUp = async () => ({ data: null, error: { message: "Supabase não inicializado" } });
    window.signIn = async () => ({ data: null, error: { message: "Supabase não inicializado" } });
    window.getCurrentUser = async () => ({ user: null, error: { message: "Supabase não inicializado" } });
    window.resetPassword = async () => ({ data: null, error: { message: "Supabase não inicializado" } });
    window.forgotPassword = async () => ({ data: null, error: { message: "Supabase não inicializado" } });
    window.updatePassword = async () => ({ data: null, error: { message: "Supabase não inicializado" } });
  }
})();
