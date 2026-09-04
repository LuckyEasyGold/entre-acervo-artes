// ============================================
// ENTRE — Configuração Global
// ============================================

window.ENTRE_CONFIG = {
  SUPABASE_URL: "https://insxzmilbebtonjcnprk.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imluc3h6bWlsYmVidG9uamNucHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTcwMTgsImV4cCI6MjEwMzY5MzAxOH0.aP03N8wIqlbhYzVYY8IiIpGAdaxoSm1bW_Eb7JJiARg",
};

window.updateConfig = function(url, key) {
  window.ENTRE_CONFIG.SUPABASE_URL = url;
  window.ENTRE_CONFIG.SUPABASE_ANON_KEY = key;
};
