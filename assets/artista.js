// ============================================
// ENTRE — Página de Artista/Orientador (dinâmica)
// ============================================

(function() {
  const params = new URLSearchParams(window.location.search);
  const artistId = params.get("id");
  const main = document.getElementById("perfil-main");
  const errorEl = document.getElementById("artist-error");
  const loadingEl = document.getElementById("artist-loading");

  if (!artistId || !main) {
    if (main) main.innerHTML = "<p>Artista não encontrado.</p>";
    return;
  }

  let allArtists = [];
  let allWorks = [];
  let currentArtist = null;

  function findArtist(id) {
    return allArtists.find(function(a) { return a.id === id; });
  }

  function findWorksFor(artist) {
    return allWorks.filter(function(w) {
      if (w.artistId && w.artistId === artist.id) return true;
      if (w.artists && w.artists.id === artist.id) return true;
      if (artist.works && Array.isArray(artist.works) && artist.works.includes(w.id)) return true;
      return false;
    });
  }

  function buildSocials(social) {
    if (!social) return "";
    const items = [];
    if (social.lattes) items.push('<a class="social-icon" href="' + social.lattes + '" target="_blank" rel="noopener" title="Lattes">L</a>');
    if (social.linkedin) items.push('<a class="social-icon" href="' + social.linkedin + '" target="_blank" rel="noopener" title="LinkedIn">in</a>');
    if (social.instagram) items.push('<a class="social-icon" href="' + social.instagram + '" target="_blank" rel="noopener" title="Instagram">ig</a>');
    if (social.youtube) items.push('<a class="social-icon" href="' + social.youtube + '" target="_blank" rel="noopener" title="YouTube">yt</a>');
    if (social.tiktok) items.push('<a class="social-icon" href="' + social.tiktok + '" target="_blank" rel="noopener" title="TikTok">tt</a>');
    if (social.x) items.push('<a class="social-icon" href="' + social.x + '" target="_blank" rel="noopener" title="X">x</a>');
    if (social.facebook) items.push('<a class="social-icon" href="' + social.facebook + '" target="_blank" rel="noopener" title="Facebook">f</a>');
    return items.length ? '<div class="social-icons">' + items.join("") + '</div>' : "";
  }

  var currentIsOwner = false;

  function renderAbout(artist, isOwner) {
    const isAdvisor = artist.type === "advisor";
    const subtitle = isAdvisor
      ? [artist.title, artist.area].filter(Boolean).join(" · ")
      : (artist.course || "Aluno do curso de Artes Visuais");

    let cta = "";
    if (isOwner) {
      cta = '<div class="profile-cta"><a class="btn btn-dark" href="perfil.html">Gerenciar meu perfil</a></div>';
    }

    return '<div class="tab-pane active" data-pane="sobre">' +
      '<div class="profile-header">' +
        '<img src="' + (artist.image || '') + '" alt="' + artist.name + '" class="profile-photo">' +
        '<div class="profile-intro">' +
          '<p class="eyebrow">' + (isAdvisor ? 'ESPECIALISTA' : 'ARTISTA') + '</p>' +
          '<h2>' + artist.name + '</h2>' +
          '<p class="profile-course">' + subtitle + '</p>' +
          buildSocials(artist.social) +
        '</div>' +
      '</div>' +
      '<div class="profile-bio"><p>' + (artist.bio || '') + '</p></div>' +
      cta +
    '</div>';
  }

  function renderCurriculo(artist) {
    if (artist.type !== "advisor") return "";
    const subjects = (artist.subjects || []).map(function(s) { return '<li>' + s + '</li>'; }).join("");
    return '<div class="tab-pane" data-pane="curriculo">' +
      '<p class="eyebrow">CURRÍCULO</p>' +
      '<div class="curriculum-text">' + (artist.curriculum || 'Currículo não disponível.') + '</div>' +
      '<div class="curriculum-meta">' +
        '<div><p class="eyebrow">ÁREA DE ATUAÇÃO</p><p>' + (artist.area || '—') + '</p></div>' +
        '<div><p class="eyebrow">DISCIPLINAS</p><ul class="subjects-list">' + (subjects || '<li>—</li>') + '</ul></div>' +
      '</div>' +
    '</div>';
  }

  function renderProducoes(artist) {
    if (artist.type !== "advisor") return "";
    const prods = artist.academicProductions || [];
    if (!prods.length) {
      return '<div class="tab-pane" data-pane="producoes"><p class="eyebrow">PRODUÇÕES ACADÊMICAS</p><p class="muted">Nenhuma produção cadastrada.</p></div>';
    }
    return '<div class="tab-pane" data-pane="producoes">' +
      '<p class="eyebrow">PRODUÇÕES ACADÊMICAS</p>' +
      '<ul class="productions-list">' + prods.map(function(p) {
        return '<li><span class="prod-type">' + (p.type || '').toUpperCase() + '</span><div><strong>' + p.title + '</strong><small>' + [p.publisher, p.journal, p.year].filter(Boolean).join(' · ') + '</small></div></li>';
      }).join("") + '</ul>' +
    '</div>';
  }

  function renderAlunos(artist) {
    if (artist.type !== "advisor") return "";
    const studentIds = artist.students || [];
    const students = studentIds.map(function(id) { return findArtist(id); }).filter(Boolean);
    if (!students.length) {
      return '<div class="tab-pane" data-pane="alunos"><p class="eyebrow">ALUNOS ORIENTADOS</p><p class="muted">Nenhum aluno vinculado.</p></div>';
    }
    return '<div class="tab-pane" data-pane="alunos">' +
      '<p class="eyebrow">ALUNOS ORIENTADOS · ' + students.length + '</p>' +
      '<div class="students-grid">' + students.map(function(s) {
        return '<button class="student-card" data-student-id="' + s.id + '">' +
          '<img src="' + (s.image || '') + '" alt="' + s.name + '">' +
          '<div><strong>' + s.name + '</strong><small>' + (s.course || '') + '</small></div>' +
        '</button>';
      }).join("") + '</div>' +
    '</div>';
  }

  function renderAcervo(artist) {
    const works = findWorksFor(artist);
    if (!works.length) {
      return '<div class="tab-pane" data-pane="acervo"><p class="eyebrow">ACERVO</p><p class="muted">Nenhuma obra publicada.</p></div>';
    }
    return '<div class="tab-pane" data-pane="acervo">' +
      '<p class="eyebrow">ACERVO · ' + works.length + ' ' + (works.length === 1 ? 'obra' : 'obras') + '</p>' +
      '<div class="acervo-grid">' + works.map(function(w) {
        return '<article class="work profile-work">' +
          '<div class="visual"><img src="' + (w.image || w.file_url || w.image_url || '') + '" alt="' + w.title + '" loading="lazy"></div>' +
          '<div class="work-info"><div><div class="work-title">' + w.title + '</div><small>' + (w.year || '') + ' · ' + (w.category || '') + '</small></div></div>' +
        '</article>';
      }).join("") + '</div>' +
    '</div>';
  }

  function navigateArtist(dir) {
    if (!allArtists.length) return;
    const idx = allArtists.indexOf(currentArtist);
    let next = idx + dir;
    if (next < 0) next = allArtists.length - 1;
    if (next >= allArtists.length) next = 0;
    const a = allArtists[next];
    if (a) {
      window.history.replaceState(null, "", "?id=" + a.id);
      renderArtist(a, currentIsOwner);
    }
  }

  async function checkOwnership(artistId) {
    try {
      const { user } = await window.getCurrentUser();
      if (!user) return false;
      const supabase = window.supabaseClient;
      if (!supabase) return false;
      const { data } = await supabase.from("artists").select("id").eq("user_id", user.id).single();
      return data && data.id === artistId;
    } catch (e) {
      return false;
    }
  }

  function renderArtist(artist, isOwner) {
    currentArtist = artist;
    currentIsOwner = isOwner || false;
    const isAdvisor = artist.type === "advisor";
    const tabs = [tabButton("Sobre", "sobre", true)];
    if (isAdvisor) tabs.push(tabButton("Currículo", "curriculo"));
    if (isAdvisor) tabs.push(tabButton("Produções", "producoes"));
    if (isAdvisor) tabs.push(tabButton("Alunos", "alunos"));
    tabs.push(tabButton("Acervo", "acervo"));

    const panes = [
      renderAbout(artist, isOwner),
      isAdvisor ? renderCurriculo(artist) : "",
      isAdvisor ? renderProducoes(artist) : "",
      isAdvisor ? renderAlunos(artist) : "",
      renderAcervo(artist)
    ].filter(Boolean).join("");

    main.innerHTML = '<div class="profile-layout">' +
      '<div class="profile-nav">' +
        '<button class="profile-arrow profile-prev" id="profile-prev" aria-label="Anterior">‹</button>' +
        '<a class="profile-close" href="home.html" aria-label="Fechar">✕</a>' +
        '<button class="profile-arrow profile-next" id="profile-next" aria-label="Próximo">›</button>' +
      '</div>' +
      '<div class="profile-tabs">' + tabs.join("") + '</div>' +
      '<div class="profile-panes">' + panes + '</div>' +
    '</div>';

    document.getElementById("profile-close").addEventListener("click", function(e) {
      e.preventDefault();
      window.history.back();
    });
    document.getElementById("profile-prev").addEventListener("click", function() { navigateArtist(-1); });
    document.getElementById("profile-next").addEventListener("click", function() { navigateArtist(1); });

    main.querySelectorAll(".profile-tab").forEach(function(t) {
      t.addEventListener("click", function() {
        main.querySelectorAll(".profile-tab").forEach(function(x) { x.classList.remove("active"); });
        main.querySelectorAll(".tab-pane").forEach(function(x) { x.classList.remove("active"); });
        t.classList.add("active");
        var pane = main.querySelector('[data-pane="' + t.dataset.tab + '"]');
        if (pane) pane.classList.add("active");
      });
    });

    main.querySelectorAll(".student-card").forEach(function(c) {
      c.addEventListener("click", function() {
        var sid = c.dataset.studentId;
        var s = findArtist(sid);
        if (s) {
          window.history.replaceState(null, "", "?id=" + s.id);
          renderArtist(s);
        }
      });
    });
  }

  async function load() {
    try {
      const supabase = window.supabaseClient;
      if (supabase) {
        try {
          const { data: artists } = await supabase.from("artists").select("*");
          const { data: works } = await supabase.from("works").select("*");
          if (artists) allArtists = artists;
          if (works) allWorks = works;
        } catch (e) {}
      }

      if (!allArtists.length) {
        const [ra, rw] = await Promise.all([fetch("/data/artists.json"), fetch("/data/works.json")]);
        allArtists = await ra.json();
        allWorks = await rw.json();
      }

      const artist = findArtist(artistId);
      if (!artist) {
        loadingEl.style.display = "none";
        errorEl.textContent = "Artista não encontrado.";
        errorEl.style.display = "block";
        return;
      }

      const isOwner = await checkOwnership(artist.id);
      loadingEl.style.display = "none";
      renderArtist(artist, isOwner);
    } catch (e) {
      console.error("artista.js load error:", e);
      loadingEl.style.display = "none";
      errorEl.textContent = "Erro ao carregar perfil.";
      errorEl.style.display = "block";
    }
  }

  document.addEventListener("keydown", function(e) {
    if (!currentArtist) return;
    if (e.key === "Escape") window.history.back();
    if (e.key === "ArrowLeft") navigateArtist(-1);
    if (e.key === "ArrowRight") navigateArtist(1);
  });

  load();
})();
