// ============================================
// ENTRE — Orientadores (especialistas/curadores)
// ============================================

(async () => {
  const advisors = (window.__ARTISTS__ || []).filter(a => a.type === "advisor");
  const grid = document.getElementById("orientadores-grid");
  const count = document.getElementById("advisors-count");
  if (count) count.textContent = advisors.length;

  if (grid) {
    grid.innerHTML = advisors.map(a => `
      <button class="person-card" data-id="${a.id}">
        <img src="${a.image || ''}" alt="${a.name}">
        <div>
          <strong>${a.name}</strong>
          <small>${a.area || a.title || 'Especialista'}</small>
        </div>
      </button>
    `).join("");

    grid.querySelectorAll(".person-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const artist = advisors.find(s => s.id === id);
        const allArtists = window.__ARTISTS__ || [];
        if (artist && window.showArtistProfile) {
          window.showArtistProfile(artist, allArtists.indexOf(artist), { works: window.__WORKS__ || [], artists: allArtists });
        }
      });
    });
  }
})();
