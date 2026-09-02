// ============================================
// ENTRE — Alunos (artistas em formação)
// ============================================

(async () => {
  const students = (window.__ARTISTS__ || []).filter(a => a.type === "student");
  const grid = document.getElementById("alunos-grid");
  const count = document.getElementById("alunos-count");
  if (count) count.textContent = students.length;

  if (grid) {
    grid.innerHTML = students.map(s => `
      <button class="person-card" data-id="${s.id}">
        <img src="${s.image || ''}" alt="${s.name}">
        <div>
          <strong>${s.name}</strong>
          <small>${s.course || 'Artes Visuais'}</small>
        </div>
      </button>
    `).join("");

    grid.querySelectorAll(".person-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.dataset.id;
        const artist = students.find(s => s.id === id);
        const allArtists = window.__ARTISTS__ || [];
        if (artist && window.showArtistProfile) {
          window.showArtistProfile(artist, allArtists.indexOf(artist), { works: window.__WORKS__ || [], artists: allArtists });
        }
      });
    });
  }
})();
