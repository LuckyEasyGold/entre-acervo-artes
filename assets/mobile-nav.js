// ============================================
// ENTRE — Navegação mobile (drawer)
// ============================================
// Observações de implementação:
// - Não duplica o botão .menu-dot já presente em algumas páginas.
// - Usa delegação de clique, porque o auth-guard reescreve o HTML do
//   .nav-auth (e recria o botão) depois que este script roda.
// - Espelha os links de conta (Entrar / perfil / Sair) dentro do drawer.

(function() {
  if (document.querySelector(".mobile-nav")) return;

  const topbar = document.querySelector(".topbar");
  if (!topbar) return;

  const nav = topbar.querySelector("nav");
  if (!nav) return;

  let menuDot = topbar.querySelector(".menu-dot");
  if (!menuDot) {
    menuDot = document.createElement("button");
    menuDot.className = "menu-dot";
    menuDot.setAttribute("aria-label", "Abrir menu");
    menuDot.setAttribute("aria-expanded", "false");
    menuDot.innerHTML = "<i></i><i></i><i></i>";
    const authContainer = topbar.querySelector(".nav-auth");
    (authContainer || topbar).appendChild(menuDot);
  }

  const mobileNav = document.createElement("div");
  mobileNav.className = "mobile-nav";
  mobileNav.setAttribute("role", "dialog");
  mobileNav.setAttribute("aria-modal", "true");
  mobileNav.setAttribute("aria-label", "Menu de navegação");
  mobileNav.innerHTML =
    '<div class="mobile-nav-inner">' +
      '<div class="mobile-nav-head">' +
        '<span class="mobile-nav-brand">ENTRE</span>' +
        '<button type="button" class="mobile-nav-close" aria-label="Fechar menu">✕</button>' +
      "</div>" +
      '<nav class="mobile-nav-links">' + nav.innerHTML + "</nav>" +
      '<div class="mobile-nav-auth"></div>' +
    "</div>";
  document.body.appendChild(mobileNav);

  const visibleDot = () => topbar.querySelector(".menu-dot");

  function open() {
    mobileNav.classList.add("open");
    document.body.style.overflow = "hidden";
    const dot = visibleDot();
    if (dot) dot.setAttribute("aria-expanded", "true");
  }
  function close() {
    mobileNav.classList.remove("open");
    document.body.style.overflow = "";
    const dot = visibleDot();
    if (dot) dot.setAttribute("aria-expanded", "false");
  }

  // Delegação: sobrevive à recriação do botão pelo auth-guard.
  document.addEventListener("click", function(e) {
    const dot = e.target.closest ? e.target.closest(".menu-dot") : null;
    if (dot) {
      e.preventDefault();
      open();
    }
  });

  mobileNav.querySelector(".mobile-nav-close").addEventListener("click", close);
  mobileNav.addEventListener("click", function(e) {
    if (e.target === mobileNav) close();
  });
  mobileNav.querySelectorAll("a").forEach(function(link) {
    link.addEventListener("click", close);
  });
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") close();
  });
  window.addEventListener("resize", function() {
    if (window.innerWidth > 850) close();
  });

  // ---- Links de conta dentro do drawer ----
  const authSlot = mobileNav.querySelector(".mobile-nav-auth");
  const navAuth = topbar.querySelector(".nav-auth");

  function mirrorAuth() {
    authSlot.innerHTML = "";
    if (!navAuth) return;

    navAuth.querySelectorAll("a, button").forEach(function(el) {
      if (el.classList.contains("menu-dot")) return;
      if (el.id === "nav-logout") {
        const sair = document.createElement("a");
        sair.href = "#";
        sair.className = "mobile-nav-logout";
        sair.textContent = "Sair";
        sair.addEventListener("click", function(ev) {
          ev.preventDefault();
          close();
          if (typeof window.doLogout === "function") window.doLogout();
        });
        authSlot.appendChild(sair);
        return;
      }
      const clone = el.cloneNode(true);
      clone.removeAttribute("id");
      authSlot.appendChild(clone);
    });
  }

  if (navAuth) {
    mirrorAuth();
    if (window.MutationObserver) {
      new MutationObserver(mirrorAuth).observe(navAuth, { childList: true, subtree: true });
    }
  }
})();
