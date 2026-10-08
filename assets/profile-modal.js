// ============================================
// ENTRE — Modal de Perfil (com abas)
// ============================================

let currentArtist = null;
let currentArtistIndex = -1;
let allArtists = [];
let allWorks = [];

function findArtist(id) {
  return allArtists.find(a => a.id === id);
}

function getWorkTypeKey(work) {
  if (!work) return "";
  const raw = String(work.file_type || "").trim().toLowerCase();
  const url = String(work.file_url || work.image || work.image_url || "").toLowerCase();
  if (work.youtube_url) return "video";
  if (["audio", "mp3", "wav", "ogg", "m4a"].includes(raw)) return "audio";
  if (["video", "mp4", "mov", "webm"].includes(raw)) return "video";
  if (/\.(pdf|doc|docx|txt|rtf|odt)$/i.test(url)) return "document";
  if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return "audio";
  if (/\.(mp4|mov|webm)$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return "image";
  if (raw) return raw;
  return "";
}

function isMediaWork(work) {
  if (!work) return false;
  const type = getWorkTypeKey(work);
  if (work.youtube_url) return true;
  return ["image", "video", "audio", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "mp4", "mov", "webm", "mp3", "wav", "ogg", "m4a"].includes(type);
}

function isTextWork(work) {
  const type = getWorkTypeKey(work);
  return ["pdf", "doc", "docx", "txt", "rtf", "odt", "document"].includes(type) || /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(String(work.file_url || work.image || work.image_url || ""));
}

function isVisibleForContext(work, isOwner = false) {
  const status = String(work && work.status ? work.status : "published").toLowerCase();
  return isOwner || status !== "draft";
}

function findWorksFor(artist, predicate = () => true, isOwner = false) {
  return allWorks.filter(w => {
    const workArtistId = w.artist_id || w.artistId || (w.artists && w.artists.id) || (w.artist && w.artist.id);
    const matchArtist = workArtistId && workArtistId === artist.id;
    const matchWorkList = artist.works && Array.isArray(artist.works) && artist.works.includes(w.id);
    if (!(matchArtist || matchWorkList)) return false;
    if (!predicate(w)) return false;
    return isVisibleForContext(w, isOwner);
  });
}

function tabButton(label, key, active = false) {
  return `<button class="profile-tab ${active ? 'active' : ''}" data-tab="${key}">${label}</button>`;
}

function buildSocials(social) {
  if (!social) return "";
  const items = [];
  if (social.lattes) items.push(`<a class="social-icon" href="${social.lattes}" target="_blank" rel="noopener" title="Lattes">L</a>`);
  if (social.linkedin) items.push(`<a class="social-icon" href="${social.linkedin}" target="_blank" rel="noopener" title="LinkedIn">in</a>`);
  if (social.instagram) items.push(`<a class="social-icon" href="${social.instagram}" target="_blank" rel="noopener" title="Instagram">ig</a>`);
  if (social.youtube) items.push(`<a class="social-icon" href="${social.youtube}" target="_blank" rel="noopener" title="YouTube">yt</a>`);
  if (social.tiktok) items.push(`<a class="social-icon" href="${social.tiktok}" target="_blank" rel="noopener" title="TikTok">tt</a>`);
  if (social.x) items.push(`<a class="social-icon" href="${social.x}" target="_blank" rel="noopener" title="X">x</a>`);
  if (social.facebook) items.push(`<a class="social-icon" href="${social.facebook}" target="_blank" rel="noopener" title="Facebook">f</a>`);
  return items.length ? `<div class="social-icons">${items.join("")}</div>` : "";
}

function normalizeAdvisorToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z]/g, "");
  }

  function isAdvisorArtist(artist) {
    if (!artist) return false;
    const role = normalizeAdvisorToken(artist.role);
    const type = normalizeAdvisorToken(artist.type);
    if (type === "advisor" || type === "orientador" || type === "orientadora" || type === "adm" || type === "moderador") return true;
    if (role.includes("orientador") || role.includes("adm") || role.includes("moderador")) return true;
    return false;
}

function renderAbout(artist, isOwner) {
  const isAdvisor = isAdvisorArtist(artist);
  const subtitle = isAdvisor
    ? [artist.title, artist.area].filter(Boolean).join(" · ")
    : (artist.course || "Aluno do curso de Artes Visuais");

  let cta = "";
  if (isOwner) {
    cta = '<div class="profile-cta"><a class="btn btn-dark" href="perfil.html">Gerenciar meu perfil</a></div>';
  }

  return `
    <div class="tab-pane active" data-pane="sobre">
      <div class="profile-header">
        <img src="${artist.image || ''}" alt="${artist.name}" class="profile-photo">
        <div class="profile-intro">
          <p class="eyebrow">${isAdvisor ? 'ESPECIALISTA' : 'ARTISTA'}</p>
          <h2>${artist.name}</h2>
          <p class="profile-course">${subtitle}</p>
          ${buildSocials(artist.social)}
        </div>
      </div>
      <div class="profile-bio">
        <p>${artist.bio || ''}</p>
      </div>
      ${cta}
    </div>`;
}

function renderCurriculo(artist) {
  if (!isAdvisorArtist(artist)) return "";
  const subjects = (artist.subjects || []).map(s => `<li>${s}</li>`).join("");
  return `
    <div class="tab-pane" data-pane="curriculo">
      <p class="eyebrow">CURRÍCULO</p>
      <div class="curriculum-text">${artist.curriculum || 'Currículo não disponível.'}</div>
      <div class="curriculum-meta">
        <div>
          <p class="eyebrow">ÁREA DE ATUAÇÃO</p>
          <p>${artist.area || '—'}</p>
        </div>
        <div>
          <p class="eyebrow">DISCIPLINAS</p>
          <ul class="subjects-list">${subjects || '<li>—</li>'}</ul>
        </div>
      </div>
    </div>`;
}

function renderProducoes(artist, isOwner = false) {
  const works = findWorksFor(artist, isTextWork, isOwner);
  const prods = Array.isArray(artist.academicProductions) && artist.academicProductions.length ? artist.academicProductions : works.map(w => ({
    type: (w.file_type || 'PDF').toString().toUpperCase(),
    title: w.title,
    publisher: w.category || 'Acervo documental',
    journal: '',
    year: w.year,
    url: w.file_url || w.image || w.image_url || '#',
    status: w.status || 'published'
  }));

  if (!prods.length) {
    return `
      <div class="tab-pane" data-pane="producoes">
        <p class="eyebrow">PRODUÇÕES ACADÊMICAS</p>
        <p class="muted">Nenhuma produção cadastrada.</p>
      </div>`;
  }
  return `
    <div class="tab-pane" data-pane="producoes">
      <p class="eyebrow">PRODUÇÕES ACADÊMICAS · ${prods.length}</p>
      <ul class="productions-list">
        ${prods.map(p => {
          const statusText = String(p.status || 'published').toLowerCase() === 'draft' ? 'Rascunho' : 'Publicado';
          return `
            <li>
              <span class="prod-type">${(p.type || 'PDF').toString().toUpperCase()}</span>
              <div>
                <strong><a href="${p.url || '#'}" target="_blank" rel="noopener">${p.title || 'Produção'}</a></strong>
                <small>${[p.publisher, p.journal, p.year, statusText].filter(Boolean).join(' · ')}</small>
              </div>
            </li>`;
        }).join("")}
      </ul>
    </div>`;
}

function renderAlunos(artist) {
  if (!isAdvisorArtist(artist)) return "";
  const studentIds = artist.students || [];
  const students = studentIds.map(id => findArtist(id)).filter(Boolean);
  if (!students.length) {
    return `
      <div class="tab-pane" data-pane="alunos">
        <p class="eyebrow">ALUNOS ORIENTADOS</p>
        <p class="muted">Nenhum aluno vinculado.</p>
      </div>`;
  }
  return `
    <div class="tab-pane" data-pane="alunos">
      <p class="eyebrow">ALUNOS ORIENTADOS · ${students.length}</p>
      <div class="students-grid">
        ${students.map(s => `
          <button class="student-card" data-student-id="${s.id}">
            <img src="${s.image || ''}" alt="${s.name}">
            <div>
              <strong>${s.name}</strong>
              <small>${s.course || ''}</small>
            </div>
          </button>`).join("")}
      </div>
    </div>`;
}

function renderAcervo(artist, isOwner = false) {
  const works = findWorksFor(artist, isMediaWork, isOwner);
  if (!works.length) {
    const emptyMessage = isOwner ? 'Nenhuma mídia no acervo. Você pode criar uma nova obra em "Publicar obra".' : 'Nenhuma mídia publicada.';
    return `
      <div class="tab-pane" data-pane="acervo">
        <p class="eyebrow">ACERVO</p>
        <p class="muted">${emptyMessage}</p>
      </div>`;
  }
  return `
    <div class="tab-pane" data-pane="acervo">
      <p class="eyebrow">ACERVO · ${works.length} ${works.length === 1 ? 'obra' : 'obras'}</p>
      <div class="acervo-grid">
        ${works.map(w => {
          const statusBadge = String(w.status || 'published').toLowerCase() === 'draft' ? '<span class="work-status draft">Rascunho</span>' : '<span class="work-status published">Publicado</span>';
          return `
          <article class="work profile-work">
            <div class="visual"><img src="${w.image || w.file_url || w.image_url || ''}" alt="${w.title}" loading="lazy"></div>
            <div class="work-info">
              <div>
                <div class="work-title">${w.title}</div>
                <small>${w.year || ''} · ${w.category || ''}</small>
              </div>
              ${statusBadge}
            </div>
          </article>`;
        }).join("")}
      </div>
    </div>`;
}

function showArtistProfile(artist, index, ctx = {}) {
  if (ctx.works) allWorks = ctx.works;
  if (ctx.artists) allArtists = ctx.artists;
  currentArtist = artist;
  currentArtistIndex = index >= 0 ? index : allArtists.indexOf(artist);

  const isAdvisor = isAdvisorArtist(artist);
  const tabs = [
    tabButton("Sobre", "sobre", true)
  ];
  if (isAdvisor) tabs.push(tabButton("Currículo", "curriculo"));
  tabs.push(tabButton("Produções", "producoes"));
  if (isAdvisor) tabs.push(tabButton("Alunos", "alunos"));
  tabs.push(tabButton("Acervo", "acervo"));

  const isOwner = ctx.isOwner === true;
  const panes = [
    renderAbout(artist, isOwner),
    isAdvisor ? renderCurriculo(artist) : "",
    renderProducoes(artist, isOwner),
    isAdvisor ? renderAlunos(artist) : "",
    renderAcervo(artist, isOwner)
  ].filter(Boolean).join("");

  const profile = document.getElementById("artist-profile");
  if (!profile) return;

  profile.innerHTML = `
    <div class="profile-layout">
      <div class="profile-nav">
        <button class="profile-arrow profile-prev" id="profile-prev" aria-label="Anterior">‹</button>
        <button class="profile-close" id="profile-close" aria-label="Fechar">✕</button>
        <button class="profile-arrow profile-next" id="profile-next" aria-label="Próximo">›</button>
      </div>
      <div class="profile-tabs">${tabs.join("")}</div>
      <div class="profile-panes">${panes}</div>
    </div>
  `;

  profile.classList.add("show");
  document.body.style.overflow = "hidden";

  document.getElementById("profile-close").addEventListener("click", closeProfile);
  document.getElementById("profile-prev").addEventListener("click", () => navigateProfile(-1));
  document.getElementById("profile-next").addEventListener("click", () => navigateProfile(1));

  profile.querySelectorAll(".profile-tab").forEach(t => {
    t.addEventListener("click", () => {
      profile.querySelectorAll(".profile-tab").forEach(x => x.classList.remove("active"));
      profile.querySelectorAll(".tab-pane").forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      profile.querySelector(`[data-pane="${t.dataset.tab}"]`)?.classList.add("active");
    });
  });

  profile.querySelectorAll(".student-card").forEach(c => {
    c.addEventListener("click", () => {
      const s = findArtist(c.dataset.studentId);
      if (s) showArtistProfile(s, allArtists.indexOf(s), { works: allWorks, artists: allArtists });
    });
  });
}

function navigateProfile(dir) {
  if (!allArtists.length) return;
  let next = currentArtistIndex + dir;
  if (next < 0) next = allArtists.length - 1;
  if (next >= allArtists.length) next = 0;
  const a = allArtists[next];
  if (a) showArtistProfile(a, next, { works: allWorks, artists: allArtists });
}

function closeProfile() {
  const profile = document.getElementById("artist-profile");
  if (profile) profile.classList.remove("show");
  document.body.style.overflow = "";
}

window.showArtistProfile = showArtistProfile;
window.closeProfile = closeProfile;

document.addEventListener("keydown", e => {
  const profile = document.getElementById("artist-profile");
  if (!profile || !profile.classList.contains("show")) return;
  if (e.key === "Escape") closeProfile();
  if (e.key === "ArrowLeft") navigateProfile(-1);
  if (e.key === "ArrowRight") navigateProfile(1);
});

window.setArtistsContext = function(artists, works) {
  allArtists = artists || [];
  allWorks = works || [];
};

async function waitForSupabaseClient(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (window.supabaseClient) return window.supabaseClient;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return window.supabaseClient || null;
}

(async () => {
  const supabase = await waitForSupabaseClient();
  if (supabase) {
    try {
      const { data: artists } = await supabase.from("artists").select("*");
      const { data: works } = await supabase.from("works").select("*");
      if (Array.isArray(artists) && artists.length) allArtists = artists;
      if (Array.isArray(works) && works.length) allWorks = works;
    } catch (e) {}
  }
  if (!allArtists.length) {
    try {
      const r = await fetch("/data/artists.json");
      allArtists = await r.json();
      const r2 = await fetch("/data/works.json");
      allWorks = await r2.json();
    } catch (e) {}
  }
  window.__ARTISTS__ = allArtists;
  window.__WORKS__ = allWorks;
})();
