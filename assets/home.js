// ============================================
// ENTRE — Home (preview aleatório de obras)
// ============================================

(async function() {
  const supabase = window.supabaseClient;
  let works = [];
  console.log("[home] supabaseClient:", !!supabase);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("works")
        .select("*, artists(name, image)")
        .eq("status", "published")
        .limit(50);
      console.log("[home] supabase works:", data?.length, "error:", error?.message);
      if (!error && data && data.length) works = data;
    } catch (e) {
      console.warn("[home] Supabase falhou, usando fallback", e);
    }
  }

  if (!works.length) {
    try {
      const r = await fetch("/data/works.json");
      console.log("[home] fetch works status:", r.status);
      const worksJson = await r.json();
      const r2 = await fetch("/data/artists.json");
      console.log("[home] fetch artists status:", r2.status);
      const artistsJson = await r2.json();
      works = worksJson.map(w => {
        const artist = artistsJson.find(a => a.id === w.artistId);
        return { ...w, artists: artist ? { name: artist.name, image: artist.image } : null };
      });
      console.log("[home] fallback works:", works.length);
    } catch (e) {
      console.warn("[home] Fallback JSON falhou", e);
    }
  }

  const shuffled = works.sort(() => Math.random() - 0.5).slice(0, 6);
  const grid = document.getElementById("preview-grid");
  console.log("[home] shuffled:", shuffled.length, "grid:", !!grid);
  if (grid && shuffled.length) {
    grid.innerHTML = shuffled.map(w => `
      <a class="preview-card" href="obra.html?id=${w.id}">
        <div class="visual"><img src="${w.image || w.image_url || ''}" alt="${w.title}" loading="lazy"></div>
        <div class="preview-info">
          <div class="work-title">${w.title}</div>
          <small>${w.artists ? w.artists.name : ''} · ${w.year || ''}</small>
        </div>
      </a>
    `).join("");
  } else if (grid) {
    grid.innerHTML = "<p style='color:var(--muted);font-size:14px;'>Nenhuma obra publicada ainda.</p>";
  }
})();
