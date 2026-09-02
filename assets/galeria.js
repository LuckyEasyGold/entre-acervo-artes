// ============================================
// ENTRE — Galeria (grid com filtros)
// ============================================

import { getSupabase } from "./supabase.js";

let allWorks = [];
let allArtists = [];
let currentFilter = "all";

async function loadData() {
  const supabase = await getSupabase();

  if (supabase) {
    try {
      const { data: works, error: wErr } = await supabase
        .from("works")
        .select("*, artists(name, image, id)")
        .eq("status", "published");
      const { data: artists, error: aErr } = await supabase.from("artists").select("*");
      if (!wErr && works) allWorks = works;
      if (!aErr && artists) allArtists = artists;
    } catch (e) {
      console.warn("Supabase falhou", e);
    }
  }

  if (!allWorks.length) {
    try {
      const r = await fetch("/data/works.json");
      allWorks = await r.json();
      const r2 = await fetch("/data/artists.json");
      allArtists = await r2.json();
    } catch (e) {
      console.warn("Fallback JSON falhou", e);
    }
  }

  render();
}

function render() {
  const filtered = currentFilter === "all"
    ? allWorks
    : allWorks.filter(w => w.category === currentFilter);

  const grid = document.getElementById("art-grid");
  const count = document.getElementById("works-count");
  if (count) count.textContent = filtered.length;

  if (grid) {
    grid.innerHTML = filtered.map(w => {
      const artist = allArtists.find(a => a.id === (w.artistId || w.artists?.id));
      const artistName = artist ? artist.name : (w.artists?.name || "—");
      const img = w.image || w.image_url || w.file_url || "";
      return `
        <article class="work" data-work-id="${w.id}">
          <div class="visual"><img src="${img}" alt="${w.title}" loading="lazy"></div>
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
        const work = allWorks.find(w => w.id === workId);
        const artist = allArtists.find(a => a.id === (work?.artistId || work?.artists?.id));
        if (work && artist && window.showArtistProfile) {
          window.showArtistProfile(artist, allArtists.indexOf(artist), { works: allWorks, modal: true });
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
