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

window.updateNav = function(user) {
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  let authContainer = topbar.querySelector(".nav-auth");
  if (!authContainer) {
    authContainer = document.createElement("div");
    authContainer.className = "nav-auth";
    topbar.appendChild(authContainer);
  }

  if (user) {
    const email = user.email || "";
    const shortName = email.split("@")[0];
    authContainer.innerHTML =
      '<a href="perfil.html" class="nav-user-link" title="' + email + '">' +
        '<span class="nav-user-icon">●</span>' +
        '<span class="nav-user-name">' + shortName + '</span>' +
      '</a>' +
      '<a href="#" id="nav-logout" class="nav-logout">Sair</a>';
    const logoutBtn = authContainer.querySelector("#nav-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function(e) {
        e.preventDefault();
        window.doLogout();
      });
    }
  } else {
    authContainer.innerHTML = '<a href="login.html" class="btn btn-sm btn-outline">Entrar</a>';
  }
};
