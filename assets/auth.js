// ============================================
// ENTRE — Auth Logic (Welcome/Login)
// ============================================

import { signIn, signUp, getCurrentUser } from "./supabase.js";

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginError = document.getElementById("login-error");
const registerError = document.getElementById("register-error");

function showError(el, msg) {
  if (el) el.textContent = msg;
}
function clearError(el) {
  if (el) el.textContent = "";
}

function activateTab(name) {
  document.querySelectorAll(".auth-tab").forEach(t => {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  if (loginForm) loginForm.style.display = name === "login" ? "flex" : "none";
  if (registerForm) registerForm.style.display = name === "register" ? "flex" : "none";
  clearError(loginError);
  clearError(registerError);
}

document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => activateTab(tab.dataset.tab));
});

document.querySelectorAll("[data-tab-trigger]").forEach(btn => {
  btn.addEventListener("click", () => activateTab(btn.dataset.tabTrigger));
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
      window.location.href = "home.html";
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
      window.location.href = "home.html";
    }
  });
}

(async () => {
  const { user } = await getCurrentUser();
  if (user && window.location.pathname.includes("welcome.html")) {
    window.location.href = "home.html";
  }
})();
