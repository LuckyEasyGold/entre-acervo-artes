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
    const fileType = work.file_type || "";
    const fileUrl = work.file_url || "";

    let html = "";

    if (youtube) {
      html += `<iframe src="${youtube}" allow="autoplay; encrypted-media" allowfullscreen style="width:100%;aspect-ratio:16/9;border:none;border-radius:12px;"></iframe>`;
    } else if (fileType === "video" && fileUrl) {
      html += `<video src="${fileUrl}" controls style="width:100%;border-radius:12px;background:#000;"></video>`;
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
