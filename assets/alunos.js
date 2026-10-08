// ============================================
// ENTRE — Alunos (artistas em formação)
// ============================================

(async function() {
  let allArtists = Array.isArray(window.__ARTISTS__) ? window.__ARTISTS__ : [];
  let allWorks = Array.isArray(window.__WORKS__) ? window.__WORKS__ : [];

  function isStudentArtist(a) {
    if (!a) return false;
    const status = String(a.status || "approved").trim().toLowerCase();
    if (status === "rejected") return false;
    return String(a.type || "").trim().toLowerCase() === "student";
  }

  function renderStudents(artists) {
    const students = (artists || []).filter(isStudentArtist);
    const grid = document.getElementById("alunos-grid");
    const count = document.getElementById("alunos-count");

    if (count) count.textContent = String(students.length);

    if (!grid) return;

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

  async function refreshData() {
    try {
      const supabase = window.supabaseClient;
      if (supabase) {
        const { data: artists } = await supabase.from("artists").select("*");
        if (Array.isArray(artists) && artists.length) {
          allArtists = artists;
          window.__ARTISTS__ = artists;
        }
      }
    } catch (e) {
      console.warn("Falha ao buscar artistas do Supabase:", e);
    }

    if (!allArtists.length) {
      try {
        const [ra, rw] = await Promise.all([
          fetch("/data/artists.json"),
          fetch("/data/works.json")
        ]);
        allArtists = await ra.json();
        allWorks = await rw.json();
        window.__ARTISTS__ = allArtists;
        window.__WORKS__ = allWorks;
      } catch (e) {
        console.warn("Falha ao carregar dados de alunos:", e);
      }
    }

    renderStudents(allArtists);
  }

  await refreshData();

  let attempts = 0;
  const refreshInterval = setInterval(function() {
    attempts += 1;
    const nextArtists = Array.isArray(window.__ARTISTS__) ? window.__ARTISTS__ : [];
    if (nextArtists.length && JSON.stringify(nextArtists) !== JSON.stringify(allArtists)) {
      allArtists = nextArtists;
      renderStudents(allArtists);
    }
    if (attempts >= 20) clearInterval(refreshInterval);
  }, 250);
})();
