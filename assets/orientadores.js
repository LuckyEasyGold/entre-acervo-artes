// ============================================
// ENTRE — Orientadores (especialistas/curadores)
// ============================================

(async function() {
  let allArtists = window.__ARTISTS__ || [];
  let allWorks = window.__WORKS__ || [];

  if (!allArtists.length) {
    try {
      const [ra, rw] = await Promise.all([
        fetch("/data/artists.json"),
        fetch("/data/works.json")
      ]);
      allArtists = await ra.json();
      allWorks = await rw.json();
    } catch (e) {
      console.warn("Falha ao carregar dados de orientadores:", e);
    }
  }

  const advisors = allArtists.filter(function(a) { return a.type === "advisor"; });
  const grid = document.getElementById("orientadores-grid");
  const count = document.getElementById("advisors-count");
  if (count) count.textContent = advisors.length;

  if (grid) {
    grid.innerHTML = advisors.map(function(a) {
      return '<button class="person-card" data-id="' + a.id + '">' +
        '<img src="' + (a.image || '') + '" alt="' + a.name + '">' +
        '<div><strong>' + a.name + '</strong>' +
        '<small>' + (a.area || a.title || 'Especialista') + '</small></div>' +
        '</button>';
    }).join("");

    grid.querySelectorAll(".person-card").forEach(function(card) {
      card.addEventListener("click", function() {
        var id = card.dataset.id;
        window.location.href = "artista.html?id=" + encodeURIComponent(id);
      });
    });
  }
})();
