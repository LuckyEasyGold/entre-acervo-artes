// ============================================
// ENTRE — Orientadores (especialistas/curadores)
// ============================================

(async function() {
  let allArtists = Array.isArray(window.__ARTISTS__) ? window.__ARTISTS__ : [];
  let allWorks = Array.isArray(window.__WORKS__) ? window.__WORKS__ : [];

  function isAdvisorArtist(a) {
    if (!a) return false;
    const role = String(a.role || "").trim().toLowerCase();
    const type = String(a.type || "").trim().toLowerCase();
    const status = String(a.status || "approved").trim().toLowerCase();
    if (status === "rejected") return false;
    return type === "advisor" || ["orientador", "orientadora", "adm", "moderador"].includes(role);
  }

  function renderAdvisors(artists) {
    const advisors = (artists || []).filter(isAdvisorArtist);
    const grid = document.getElementById("orientadores-grid");
    const count = document.getElementById("advisors-count");

    if (count) count.textContent = String(advisors.length);

    if (!grid) return;

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

  async function refreshData() {
    try {
      const supabase = window.supabaseClient;
      if (supabase) {
        const { data: artists } = await supabase.from("artists").select("*");
        if (Array.isArray(artists) && artists.length) {
          allArtists = artists;
          if (Array.isArray(window.__ARTISTS__)) {
            window.__ARTISTS__ = artists;
          }
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
        console.warn("Falha ao carregar dados de orientadores:", e);
      }
    }

    renderAdvisors(allArtists);
  }

  await refreshData();

  let attempts = 0;
  const refreshInterval = setInterval(function() {
    attempts += 1;
    const nextArtists = Array.isArray(window.__ARTISTS__) ? window.__ARTISTS__ : [];
    if (nextArtists.length && JSON.stringify(nextArtists) !== JSON.stringify(allArtists)) {
      allArtists = nextArtists;
      renderAdvisors(allArtists);
    }
    if (attempts >= 20) clearInterval(refreshInterval);
  }, 250);
})();
