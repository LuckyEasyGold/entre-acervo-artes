// ============================================
// ENTRE — Auth Logic
// ============================================

import { signIn, signUp, signOut, getCurrentUser } from "./supabase.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

function showError(el, msg) {
  if (el) { el.textContent = msg; }
}

function clearError(el) {
  if (el) { el.textContent = ""; }
}

document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    if (target === "login") {
      loginForm.style.display = "block";
      registerForm.style.display = "none";
    } else {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    }
    clearError(loginError);
    clearError(registerError);
  });
});

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError(loginError);
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const { data, error } = await signIn(email, password);
    if (error) {
      showError(loginError, error.message || "Erro ao entrar.");
    } else if (data?.user) {
      window.location.href = "dashboard.html";
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError(registerError);
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;
    const type = document.getElementById("reg-type").value;
    const { data, error } = await signUp(email, password, { name, type });
    if (error) {
      showError(registerError, error.message || "Erro ao criar conta.");
    } else if (data?.user) {
      window.location.href = "dashboard.html";
    }
  });
}

// Verificar sessão existente
(async () => {
  const { user } = await getCurrentUser();
  if (user && window.location.pathname.includes("login.html")) {
    window.location.href = "dashboard.html";
  }
})();
