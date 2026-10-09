// ============================================
// ENTRE — Lightbox e proteção de conteúdo
// ============================================

(function() {
  let overlay = null;
  let captionTitle = null;
  let captionDesc = null;

  function createOverlay() {
    overlay = document.createElement("div");
    overlay.className = "protected-overlay hidden";
    overlay.innerHTML = `
      <div class="protected-content">
        <button class="protected-close" aria-label="Fechar">✕</button>
        <div class="protected-media no-copy"></div>
        <div class="protected-caption">
          <h3 class="protected-title"></h3>
          <p class="protected-desc"></p>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector(".protected-close");
    closeBtn.addEventListener("click", closeLightbox);
    overlay.addEventListener("click", function(e) {
      if (e.target === overlay) closeLightbox();
    });

    captionTitle = overlay.querySelector(".protected-title");
    captionDesc = overlay.querySelector(".protected-desc");

    document.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
        closeLightbox();
      }
    });

    disableRightClick(overlay);
  }

  function disableRightClick(root) {
    root.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });
  }

  function openLightbox(work, artistName) {
    if (!overlay) createOverlay();
    const media = overlay.querySelector(".protected-media");
    const title = work.title || "";
    const desc = work.description || "";
    const image = work.image || work.image_url || work.file_url || "";
    const youtube = work.youtube_url || "";
    const fileUrl = work.file_url || "";

    function normalizeMediaType(value, url = "") {
      const normalized = String(value || "").trim().toLowerCase();
      if (["audio", "mp3", "wav", "ogg", "m4a"].includes(normalized)) return "audio";
      if (["video", "mp4", "mov", "webm"].includes(normalized)) return "video";
      if (["pdf", "doc", "docx", "txt", "rtf", "odt", "document"].includes(normalized)) return "pdf";
      if (["image", "jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(normalized)) return "image";
      if (normalized === "youtube" || /youtube|youtu\.be/.test(url)) return "youtube";
      if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return "audio";
      if (/\.(mp4|mov|webm)$/i.test(url)) return "video";
      if (/\.(pdf|doc|docx|txt|rtf|odt)$/i.test(url)) return "pdf";
      if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url)) return "image";
      return normalized || "image";
    }

    function createAudioMiniPlayer(trackUrl, label) {
      const safeTitle = String(label || "Arquivo de áudio")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

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

    const fileType = normalizeMediaType(work.file_type || "", fileUrl || image);

    let html = "";

    if (youtube) {
      html += `<iframe src="${youtube}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;aspect-ratio:16/9;border:none;border-radius:12px;"></iframe>`;
    } else if (fileType === "video" && fileUrl) {
      html += `<video src="${fileUrl}" controls playsinline preload="metadata" style="width:100%;border-radius:12px;background:#000;"></video>`;
    } else if (fileType === "audio" && fileUrl) {
      html += createAudioMiniPlayer(fileUrl, title);
    } else if (fileType === "pdf" && fileUrl) {
      html += `<iframe src="${fileUrl}" style="width:100%;height:60vh;border:none;border-radius:12px;"></iframe>`;
    } else if (image) {
      html += `
        <img src="${image}" alt="${title}" draggable="false">
        <div class="watermark" aria-hidden="true">${artistName || ""} · ENTRE</div>
      `;
    }

    media.innerHTML = html;
    media.classList.add("no-copy");

    const audioPlayer = media.querySelector('.audio-hidden-player');
    const playBtn = media.querySelector('.audio-mini-button');
    const slider = media.querySelector('.audio-mini-slider');
    const timeEl = media.querySelector('.audio-mini-time');

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
            console.warn('[lightbox] erro ao reproduzir áudio', error);
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
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 100;
        slider.max = String(duration);
        updateTimeLabel(audioPlayer.currentTime || 0);
      });

      audioPlayer.addEventListener('timeupdate', () => {
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 100;
        slider.value = String(audioPlayer.currentTime || 0);
        slider.max = String(duration);
        updateTimeLabel(audioPlayer.currentTime || 0);
      });

      slider.addEventListener('input', () => {
        const duration = Number.isFinite(audioPlayer.duration) && audioPlayer.duration > 0 ? audioPlayer.duration : 0;
        if (duration) {
          audioPlayer.currentTime = Number(slider.value);
        }
      });
    }

    disableRightClick(media);

    captionTitle.textContent = title;
    captionDesc.textContent = [artistName, desc].filter(Boolean).join(" — ");

    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!overlay) return;
    overlay.classList.add("hidden");
    overlay.querySelector(".protected-media").innerHTML = "";
    document.body.style.overflow = "";
  }

  window.openProtectedLightbox = openLightbox;
  window.closeProtectedLightbox = closeLightbox;

  document.addEventListener("contextmenu", function(e) {
    const overlayMedia = e.target.closest(".protected-media");
    if (overlayMedia) {
      e.preventDefault();
    }
  });
})();
