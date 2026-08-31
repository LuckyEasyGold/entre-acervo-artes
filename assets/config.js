// ============================================
// ENTRE — Configuração
// ============================================

const CONFIG = {
  SUPABASE_URL: "https://SEU_PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_ANON_KEY",
};

export function getConfig() {
  return CONFIG;
}

export function updateConfig(url, key) {
  CONFIG.SUPABASE_URL = url;
  CONFIG.SUPABASE_ANON_KEY = key;
}
