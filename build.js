#!/usr/bin/env node
// ============================================
// ENTRE — Build Script
// Generates assets/config.js from .env
// ============================================

const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env");
const configPath = path.join(__dirname, "assets", "config.js");

// Read .env file
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) return;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // Remove aspas simples ou duplas em volta do valor (comum em arquivos .env)
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  });
}

// Preferência: arquivo .env local (fonte da verdade em dev) > process.env (usado no build do Vercel, onde não há .env)
const supabaseUrl = envVars.SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = envVars.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

const configContent = `// ============================================
// ENTRE — Configuração Global
// Gerado automaticamente por build.js — NÃO EDITE MANUALMENTE
// ============================================

window.ENTRE_CONFIG = {
  SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
  SUPABASE_ANON_KEY: ${JSON.stringify(supabaseKey)},
};

window.updateConfig = function(url, key) {
  window.ENTRE_CONFIG.SUPABASE_URL = url;
  window.ENTRE_CONFIG.SUPABASE_ANON_KEY = key;
};
`;

fs.writeFileSync(configPath, configContent, "utf-8");

if (supabaseUrl && supabaseKey) {
  console.log("✅ config.js gerado com credenciais do .env");
} else {
  console.log("⚠️  config.js gerado, mas variáveis do .env estão vazias");
  console.log("   Defina SUPABASE_URL e SUPABASE_ANON_KEY no .env");
}
