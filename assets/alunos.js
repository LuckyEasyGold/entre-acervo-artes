// ============================================
// ENTRE — Alunos (artistas em formação)
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
      console.warn("Falha ao carregar dados de alunos:", e);
    }
  }

  const students = allArtists.filter(function(a) { return a.type === "student"; });
  const grid = document.getElementById("alunos-grid");
  const count = document.getElementById("alunos-count");
  if (count) count.textContent = students.length;

  if (grid) {
    grid.innerHTML = students.map(function(s) {
      return '<button class="person-card" data-id="' + s.id + '">' +
        '<img src="' + (s.image || '') + '" alt="' + s.name + '">' +
        '<div><strong>' + s.name + '</strong>' +
        '<small>' + (s.course || 'Artes Visuais') + '</small></div>' +
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
