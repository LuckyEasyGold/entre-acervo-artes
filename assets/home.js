// ============================================
// ENTRE — Home (preview aleatório de obras)
// ============================================

(async function() {
  async function waitForSupabaseClient(maxAttempts = 30) {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      if (window.supabaseClient) return window.supabaseClient;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return window.supabaseClient || null;
  }

  const supabase = await waitForSupabaseClient();
  let works = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("works")
        .select("*, artists!works_artist_id_fkey(name, image)")
        .eq("status", "published")
        .limit(50);
      if (!error && Array.isArray(data) && data.length) works = data;
    } catch (e) {
      console.warn("[home] Supabase falhou, usando fallback", e);
    }
  }

  if (!works.length) {
    try {
      const r = await fetch("/data/works.json");
      const worksJson = await r.json();
      const r2 = await fetch("/data/artists.json");
      const artistsJson = await r2.json();
      works = (worksJson || []).map(w => {
        const artist = (artistsJson || []).find(a => a.id === w.artistId);
        return { ...w, artists: artist ? { name: artist.name, image: artist.image } : null };
      });
    } catch (e) {
      console.warn("[home] Fallback JSON falhou", e);
    }
  }

  const shuffled = works.sort(() => Math.random() - 0.5).slice(0, 6);
  const grid = document.getElementById("preview-grid");
  if (grid && shuffled.length) {
    grid.innerHTML = shuffled.map(w => `
      <button class="preview-card" type="button" data-work-id="${w.id}" aria-label="Abrir obra ${w.title}">
        <div class="visual"><img src="${w.image || w.image_url || ''}" alt="${w.title}" loading="lazy"></div>
        <div class="preview-info">
          <div class="work-title">${w.title}</div>
          <small>${w.artists ? w.artists.name : ''} · ${w.year || ''}</small>
        </div>
      </button>
    `).join("");

    grid.querySelectorAll(".preview-card").forEach(button => {
      button.addEventListener("click", () => {
        const workId = button.dataset.workId;
        const work = shuffled.find(item => item.id === workId);
        if (!work) return;

        if (typeof window.openProtectedLightbox === "function") {
          window.openProtectedLightbox(work, work.artists?.name || "");
        } else {
          window.location.href = "obra.html?id=" + encodeURIComponent(work.id);
        }
      });
    });
  } else if (grid) {
    grid.innerHTML = "<p style='color:var(--muted);font-size:14px;'>Nenhuma obra publicada ainda.</p>";
  }
})();
