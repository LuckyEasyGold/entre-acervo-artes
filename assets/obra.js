// ============================================
// ENTRE — Página individual de obra
// ============================================

(async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const main = document.getElementById("obra-main");
  if (!id || !main) return;

  const supabase = window.supabaseClient;
  let work = null;
  let artist = null;
  let allArtists = [];
  let allWorks = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from("works")
        .select("*, artists(*)")
        .eq("id", id)
        .single();
      if (data) {
        work = data;
        artist = data.artists;
      }
    } catch (e) {}
  }

  if (!work) {
    try {
      const r = await fetch("/data/works.json");
      allWorks = await r.json();
      const r2 = await fetch("/data/artists.json");
      allArtists = await r2.json();
      work = allWorks.find(w => w.id === id);
      artist = allArtists.find(a => a.id === work?.artistId);
    } catch (e) {}
  }

  if (!work) {
    if (main) main.innerHTML = "<p>Obra não encontrada.</p>";
    return;
  }

  const fileUrl = work.file_url || work.image || work.image_url || "";

  function normalizeMediaType(value, url = "") {
    const normalized = String(value || "").trim().toLowerCase();
    const audioValues = ["audio", "mp3", "wav", "ogg", "m4a"];
    const videoValues = ["video", "mp4", "mov", "webm"];
    const imageValues = ["image", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const pdfValues = ["pdf", "doc", "docx", "txt", "rtf", "odt", "document"];

    if (audioValues.includes(normalized)) return "audio";
    if (videoValues.includes(normalized)) return "video";
    if (imageValues.includes(normalized)) return "image";
    if (pdfValues.includes(normalized)) return "pdf";
    if (normalized === "youtube" || /youtube|youtu\.be/.test(url)) return "youtube";
    if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return "audio";
    if (/\.(mp4|mov|webm)$/i.test(url)) return "video";
    if (/\.(pdf|doc|docx|txt|rtf|odt)$/i.test(url)) return "pdf";
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return "image";
    return normalized || "image";
  }

  const fileType = normalizeMediaType(work.file_type || (work.youtube_url ? "youtube" : "image"), fileUrl);
  let mediaHtml = "";
  if (fileType === "video" && fileUrl) {
    mediaHtml = `<video src="${fileUrl}" controls></video>`;
  } else if (fileType === "audio" && fileUrl) {
    mediaHtml = `
      <div class="audio-mini-player">
        <div class="audio-mini-meta">
          <span>Áudio</span>
          <strong>${(work.title || "Arquivo de áudio").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</strong>
        </div>
        <audio src="${fileUrl}" controls preload="metadata" playsinline></audio>
      </div>
    `;
  } else if (fileType === "youtube" && work.youtube_url) {
    const m = work.youtube_url.match(/(?:youtu\.be\/|v=)([\w-]+)/);
    const embed = m ? `https://www.youtube.com/embed/${m[1]}` : work.youtube_url;
    mediaHtml = `<iframe src="${embed}" allowfullscreen></iframe>`;
  } else if (fileType === "pdf" && fileUrl) {
    mediaHtml = `<iframe src="${fileUrl}"></iframe>`;
  } else if (fileUrl) {
    mediaHtml = `<img src="${fileUrl}" alt="${work.title}" class="no-copy" draggable="false">`;
  }

  if (main) {
    main.innerHTML = `
      <article class="obra-detail">
        <div class="obra-media no-copy">${mediaHtml}</div>
        <div class="obra-meta">
          <p class="eyebrow">${(work.category || '').toUpperCase()}</p>
          <h1>${work.title}</h1>
          <p class="obra-author">
            por <a href="#" data-artist-id="${artist?.id}">${artist?.name || '—'}</a>
            ${work.year ? ' · ' + work.year : ''}
          </p>
          <p>${work.description || ''}</p>
          <button class="btn btn-dark" id="expand-btn">Ampliar visualização</button>
        </div>
      </article>
    `;

    const authorLink = main.querySelector("[data-artist-id]");
    if (authorLink) {
      authorLink.addEventListener("click", e => {
        e.preventDefault();
        if (artist) {
          window.location.href = "artista.html?id=" + encodeURIComponent(artist.id);
        }
      });
    }

    const expandBtn = document.getElementById("expand-btn");
    if (expandBtn && typeof window.openProtectedLightbox === "function") {
      expandBtn.addEventListener("click", () => {
        window.openProtectedLightbox(work, artist?.name || "");
      });
    }

    disableRightClick(main);
  }

  function disableRightClick(root) {
    root.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });
  }
})();
