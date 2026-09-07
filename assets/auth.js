// ============================================
// ENTRE — Auth Logic (Welcome/Login)
// ============================================

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
  document.querySelectorAll(".auth-tab").forEach(function(t) {
    t.classList.toggle("active", t.dataset.tab === name);
  });
  if (loginForm) loginForm.style.display = name === "login" ? "flex" : "none";
  if (registerForm) registerForm.style.display = name === "register" ? "flex" : "none";
  clearError(loginError);
  clearError(registerError);
}

document.querySelectorAll(".auth-tab").forEach(function(tab) {
  tab.addEventListener("click", function() { activateTab(tab.dataset.tab); });
});

document.querySelectorAll("[data-tab-trigger]").forEach(function(btn) {
  btn.addEventListener("click", function() { activateTab(btn.dataset.tabTrigger); });
});

function setupPasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach(function(btn) {
    btn.addEventListener("click", function() {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "🙈" : "👁";
      btn.setAttribute("aria-label", isPassword ? "Ocultar senha" : "Mostrar senha");
    });
  });
}

function bindForms() {
  if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      clearError(loginError);
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;
      try {
        const { data, error } = await window.signIn(email, password);
        if (error) {
          showError(loginError, "Credenciais inválidas.");
        } else if (data && data.user) {
          const supabase = window.supabaseClient;
          let approved = true;
          let role = null;
          if (supabase) {
            const { data: artist } = await supabase
              .from("artists")
              .select("status, role")
              .eq("user_id", data.user.id)
              .single();
            if (artist) {
              if (artist.status === "pending") approved = false;
              role = artist.role;
            }
          }
          if (!approved) {
            showError(loginError, "Sua conta está aguardando aprovação de um orientador.");
            await window.signOut();
            return;
          }
          if (["adm", "moderador", "orientador"].includes(role)) {
            window.location.href = "home.html";
          } else {
            window.location.href = "home.html";
          }
        }
      } catch (err) {
        console.error("login submit error:", err);
        showError(loginError, "Erro de conexão. Tente novamente.");
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      clearError(registerError);
      const name = document.getElementById("reg-name").value.trim();
      const email = document.getElementById("reg-email").value.trim();
      const password = document.getElementById("reg-password").value;
      const confirm = document.getElementById("reg-password-confirm");
      const confirmValue = confirm ? confirm.value : "";
      const typeInput = document.querySelector('input[name="reg-type"]:checked');
      const type = typeInput ? typeInput.value : "student";

      if (password !== confirmValue) {
        showError(registerError, "As senhas não conferem.");
        return;
      }

      try {
        const { data, error } = await window.signUp(email, password, { name });
        if (error) {
          showError(registerError, "Não foi possível criar a conta. Tente novamente.");
        } else if (data && data.user) {
          const supabase = window.supabaseClient;
          if (supabase) {
            try {
              const { error: insertError } = await supabase.from("artists").insert({
                id: "artist-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
                user_id: data.user.id,
                name: name,
                type: type,
                role: type === "advisor" ? "orientador" : "artista",
                status: "pending",
                moderator_votes: 0
              });
              if (insertError) {
                console.error("[auth] insert artist error:", insertError);
                showError(registerError, "Conta criada, mas houve um problema ao salvar o perfil. Faça login e complete seu perfil.");
              } else {
                showError(registerError, "Conta criada! Aguardando aprovação de um orientador.");
              }
            } catch (insertErr) {
              console.error("[auth] insert artist exception:", insertErr);
              showError(registerError, "Conta criada, mas houve um problema ao salvar o perfil. Faça login e complete seu perfil.");
            }
          } else {
            showError(registerError, "Conta criada! Aguardando aprovação de um orientador.");
          }
          registerForm.reset();
        }
      } catch (err) {
        console.error("register submit error:", err);
        showError(registerError, "Erro de conexão. Tente novamente.");
      }
    });
  }
}

(async function waitForSupabase() {
  const start = Date.now();
  while (
    typeof window.signIn !== "function" ||
    typeof window.signUp !== "function" ||
    typeof window.getCurrentUser !== "function"
  ) {
    if (Date.now() - start > 5000) {
      console.error("[auth] Timeout aguardando Supabase inicializar");
      return;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  console.log("[auth] Supabase pronto:", typeof window.signUp, typeof window.signIn, typeof window.getCurrentUser);
  setupPasswordToggles();
  bindForms();
})();
