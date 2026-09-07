(function() {
  if (document.querySelector('.mobile-nav')) return;

  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const nav = topbar.querySelector('nav');
  if (!nav) return;

  const menuDot = document.createElement('button');
  menuDot.className = 'menu-dot';
  menuDot.setAttribute('aria-label', 'Menu');
  menuDot.innerHTML = '<i></i><i></i><i></i>';

  const mobileNav = document.createElement('div');
  mobileNav.className = 'mobile-nav';
  mobileNav.innerHTML = '<div class="mobile-nav-inner"><button class="mobile-nav-close" aria-label="Fechar menu">✕</button>' + nav.innerHTML + '</div>';

  document.body.appendChild(mobileNav);

  menuDot.addEventListener('click', function() {
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  const closeBtn = mobileNav.querySelector('.mobile-nav-close');
  closeBtn.addEventListener('click', function() {
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
  });

  mobileNav.addEventListener('click', function(e) {
    if (e.target === mobileNav) {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    }
  });

  const navAuth = topbar.querySelector('.nav-auth');
  if (navAuth) {
    navAuth.insertBefore(menuDot, navAuth.firstChild);
  } else {
    topbar.appendChild(menuDot);
  }
})();
