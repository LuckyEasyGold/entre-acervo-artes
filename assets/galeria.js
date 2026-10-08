// ============================================
// ENTRE — Galeria (grid com filtros)
// ============================================

var currentFilter = "all";
let galleryWorks = [];
let galleryArtists = [];

function getFileTypeKey(work) {
  if (!work) return "";
  const raw = String(work.file_type || "").trim().toLowerCase();
  if (raw) return raw;
  const url = String(work.file_url || work.image || work.image_url || "").toLowerCase();
  if (/\.(pdf|doc|docx|txt|rtf|odt)$/i.test(url)) return "document";
  if (/\.(mp4|mov|webm|mp3|wav|ogg|m4a)$/i.test(url)) return "video";
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return "image";
  return "";
}

function isMediaWork(work) {
  if (!work) return false;
  const type = getFileTypeKey(work);
  if (work.youtube_url) return true;
  return ["image", "video", "audio", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "mp4", "mov", "webm", "mp3", "wav", "ogg", "m4a"].includes(type);
}

function isTextWork(work) {
  const type = getFileTypeKey(work);
  return ["pdf", "doc", "docx", "txt", "rtf", "odt", "document"].includes(type) || /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(String(work.file_url || work.image || work.image_url || ""));
}

async function waitForSupabaseClient(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (window.supabaseClient) return window.supabaseClient;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return window.supabaseClient || null;
}

async function loadData() {
  const supabase = await waitForSupabaseClient();

  if (supabase) {
    try {
      const { data: works, error: wErr } = await supabase
        .from("works")
        .select("*")
        .eq("status", "published");
      const { data: artists, error: aErr } = await supabase.from("artists").select("*");
      if (!wErr && Array.isArray(works) && works.length) galleryWorks = works.filter(isMediaWork);
      if (!aErr && Array.isArray(artists) && artists.length) galleryArtists = artists;
    } catch (e) {
      console.warn("[galeria] Supabase falhou", e);
    }
  }

  if (!galleryWorks.length) {
    try {
      const r = await fetch("/data/works.json");
      galleryWorks = (await r.json()).filter(isMediaWork);
      const r2 = await fetch("/data/artists.json");
      galleryArtists = await r2.json();
    } catch (e) {
      console.warn("[galeria] Fallback JSON falhou", e);
    }
  }

  window.__WORKS__ = galleryWorks;
  window.__ARTISTS__ = galleryArtists;
  render();
}

function render() {
  const dataset = galleryWorks.length ? galleryWorks : (Array.isArray(window.__WORKS__) ? window.__WORKS__.filter(isMediaWork) : []);
  const filtered = currentFilter === "all"
    ? dataset
    : dataset.filter(w => w.category === currentFilter);

  const grid = document.getElementById("art-grid");
  const count = document.getElementById("works-count");
  if (count) count.textContent = filtered.length;

  if (grid) {
    grid.innerHTML = filtered.map(w => {
      const artistId = w.artist_id || w.artistId || w.artists?.id || w.artist?.id;
      const artist = galleryArtists.find(a => a.id === artistId);
      const artistName = artist ? artist.name : (w.artists?.name || "—");
      const img = w.image || w.image_url || w.file_url || "";
      const isPdf = String(w.file_type || "").toLowerCase() === "pdf" || String(w.file_url || "").toLowerCase().endsWith(".pdf");
      const visual = isPdf
        ? '<div class="visual pdf-visual"><span>PDF</span></div>'
        : `<div class="visual"><img src="${img}" alt="${w.title}" loading="lazy"></div>`;
      return `
        <article class="work" data-work-id="${w.id}">
          ${visual}
          <div class="work-info">
            <div>
              <div class="work-title">${w.title}</div>
              <small>${artistName} · ${w.year || ""}</small>
            </div>
            <div class="work-meta">${w.category || ""}</div>
          </div>
        </article>`;
    }).join("");

    grid.querySelectorAll(".work").forEach(el => {
      el.addEventListener("click", () => {
        const workId = el.dataset.workId;
        const work = dataset.find(w => w.id === workId);
        const artistId = work?.artist_id || work?.artistId || work?.artists?.id || work?.artist?.id;
        const artist = galleryArtists.find(a => a.id === artistId);
        const artistName = artist ? artist.name : (work?.artists?.name || "");
        if (work && typeof window.openProtectedLightbox === "function") {
          window.openProtectedLightbox(work, artistName);
        } else if (artist) {
          window.location.href = "artista.html?id=" + encodeURIComponent(artist.id);
        }
      });
    });
  }
}

document.querySelectorAll("[data-filter]").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    render();
  });
});

loadData();
