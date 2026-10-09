// ============================================
// ENTRE — Página individual de obra
// ============================================

async function waitForSupabaseClient(maxAttempts = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (window.supabaseClient) return window.supabaseClient;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  return window.supabaseClient || null;
}

(async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const main = document.getElementById("obra-main");
  if (!id || !main) return;

  // O cliente é criado de forma assíncrona em supabase.js; esperar aqui
  // evita cair no fallback de /data/works.json e mostrar "Obra não encontrada".
  const supabase = await waitForSupabaseClient();
  let work = null;
  let artist = null;
  let allArtists = [];
  let allWorks = [];

  if (supabase) {
    try {
      const { data } = await supabase
        .from("works")
        // works tem 3 FKs para artists (artist_id, advisor_id, reviewed_by);
        // sem o hint o PostgREST devolve PGRST201 e a obra nunca é encontrada.
        .select("*, artists!works_artist_id_fkey(*)")
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

  function createAudioMiniPlayer(trackUrl, title) {
    const safeTitle = String(title || "Arquivo de áudio")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");

    return `
      <div class="audio-mini-player">
        <div class="audio-mini-meta">
          <span>Áudio</span>
          <strong>${safeTitle}</strong>
        </div>
        <div class="audio-mini-controls">
          <button type="button" class="audio-mini-button" aria-label="Reproduzir ou pausar áudio">▶</button>
          <div class="audio-mini-progress-wrap">
            <input class="audio-mini-slider" type="range" min="0" max="100" value="0" aria-label="Progresso do áudio">
          </div>
          <span class="audio-mini-time">0:00</span>
        </div>
        <audio class="audio-hidden-player" src="${trackUrl}" preload="metadata" playsinline></audio>
      </div>
    `;
  }

  const fileType = normalizeMediaType(work.file_type || (work.youtube_url ? "youtube" : "image"), fileUrl);
  let mediaHtml = "";
  if (fileType === "video" && fileUrl) {
    mediaHtml = `<video src="${fileUrl}" controls playsinline preload="metadata"></video>`;
  } else if (fileType === "audio" && fileUrl) {
    mediaHtml = createAudioMiniPlayer(fileUrl, work.title || "Arquivo de áudio");
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

    const audioPlayer = main.querySelector('.audio-hidden-player');
    const playBtn = main.querySelector('.audio-mini-button');
    const slider = main.querySelector('.audio-mini-slider');
    const timeEl = main.querySelector('.audio-mini-time');

    if (audioPlayer && playBtn && slider && timeEl) {
      const updateTimeLabel = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        timeEl.textContent = `${minutes}:${String(secs).padStart(2, '0')}`;
      };

      playBtn.addEventListener('click', async () => {
        if (audioPlayer.paused) {
          try {
            await audioPlayer.play();
            playBtn.textContent = '❚❚';
          } catch (error) {
            console.warn('[obra] erro ao reproduzir áudio', error);
          }
        } else {
          audioPlayer.pause();
          playBtn.textContent = '▶';
        }
      });

      audioPlayer.addEventListener('play', () => {
        playBtn.textContent = '❚❚';
      });

      audioPlayer.addEventListener('pause', () => {
        playBtn.textContent = '▶';
      });

      audioPlayer.addEventListener('loadedmetadata', () => {
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 0;
        slider.max = String(duration || 100);
        updateTimeLabel(audioPlayer.currentTime || 0);
      });

      audioPlayer.addEventListener('timeupdate', () => {
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 100;
        slider.value = String(audioPlayer.currentTime || 0);
        slider.max = String(duration || 100);
        updateTimeLabel(audioPlayer.currentTime || 0);
      });

      slider.addEventListener('input', () => {
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 0;
        const target = duration ? (Number(slider.value) / duration) * audioPlayer.duration : 0;
        audioPlayer.currentTime = target;
        updateTimeLabel(audioPlayer.currentTime || 0);
      });
    }

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
