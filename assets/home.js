// ============================================
// ENTRE — Home (preview aleatório de obras)
// ============================================

import { getSupabase } from "./supabase.js";

(async () => {
  const supabase = await getSupabase();
  let works = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("works")
        .select("*, artists(name, image)")
        .eq("status", "published")
        .limit(50);
      if (!error && data && data.length) works = data;
    } catch (e) {
      console.warn("Supabase falhou, usando fallback", e);
    }
  }

  if (!works.length) {
    try {
      const r = await fetch("/data/works.json");
      const worksJson = await r.json();
      const r2 = await fetch("/data/artists.json");
      const artistsJson = await r2.json();
      works = worksJson.map(w => {
        const artist = artistsJson.find(a => a.id === w.artistId);
        return { ...w, artists: artist ? { name: artist.name, image: artist.image } : null };
      });
    } catch (e) {
      console.warn("Fallback JSON falhou", e);
    }
  }

  const shuffled = works.sort(() => Math.random() - 0.5).slice(0, 6);
  const grid = document.getElementById("preview-grid");
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
