// ============================================
// ENTRE — Auth Guard (Global)
// ============================================

let cachedUser = null;
let initPromise = null;

window.initAuthGuard = async function() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const start = Date.now();
    while (typeof window.getCurrentUser !== "function" && Date.now() - start < 4000) {
      await new Promise(r => setTimeout(r, 50));
    }

    const attempt = async () => {
      try {
        const result = await window.getCurrentUser();
        const user = result && result.user ? result.user : null;
        cachedUser = user;
        console.log("[auth-guard] user:", user ? user.email : "null");
        window.updateNav(user);
        return user;
      } catch (e) {
        console.warn("[auth-guard] init error:", e);
        cachedUser = null;
        window.updateNav(null);
        return null;
      }
    };

    let user = await attempt();
    if (!user) {
      await new Promise(r => setTimeout(r, 1000));
      user = await attempt();
    }
    return user;
  })();

  return initPromise;
};

window.getUser = function() {
  return cachedUser;
};

window.refreshNav = function() {
  window.initAuthGuard();
};

window.doLogout = async function() {
  await window.signOut();
  cachedUser = null;
  window.location.href = "home.html";
};

window.requireAuth = async function() {
  const user = await window.initAuthGuard();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
};

window.updateNav = async function(user) {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  let authContainer = topbar.querySelector(".nav-auth");
  if (!authContainer) {
    authContainer = document.createElement("div");
    authContainer.className = "nav-auth";
    topbar.appendChild(authContainer);
  }

  if (!user) {
    authContainer.innerHTML = '<a href="login.html" class="btn btn-sm btn-outline">Entrar</a>';
    return;
  }

  const supabase = window.supabaseClient;
  let role = null;
  if (supabase) {
    const { data } = await supabase
      .from("artists")
      .select("role")
      .eq("user_id", user.id)
      .single();
    role = data?.role || null;
  }

  const canModerate = ["adm", "moderador", "orientador"].includes(role);

  let html = "";
  if (canModerate) {
    html += '<a href="moderacao.html" class="nav-moderacao">Moderação</a>';
  }
  html +=
    '<a href="perfil.html" class="nav-user-link" title="' + user.email + '">' +
      '<span class="nav-user-icon">●</span>' +
      '<span class="nav-user-name">' + (user.email || "").split("@")[0] + '</span>' +
    '</a>' +
    '<a href="#" id="nav-logout" class="nav-logout">Sair</a>';

  authContainer.innerHTML = html;

  const logoutBtn = authContainer.querySelector("#nav-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", function(e) {
      e.preventDefault();
      window.doLogout();
    });
  }
};
