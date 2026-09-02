// ============================================
// ENTRE — Perfil do usuário logado
// ============================================

import { getCurrentUser, signOut } from "./supabase.js";

(async () => {
  const main = document.querySelector(".perfil-main");
  const { user } = await getCurrentUser();
  if (!user) {
    window.location.href = "welcome.html";
    return;
  }

  const supabase = await getSupabase();
  if (!supabase) {
    if (main) main.innerHTML = "<p>Supabase não configurado.</p>";
    return;
  }

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!artist) {
    if (main) {
      main.innerHTML = `
        <div class="perfil-empty">
          <h1>Complete seu perfil</h1>
          <p>Você ainda não preencheu seu perfil. Atualize com nome, bio e foto.</p>
          <a class="btn btn-dark" href="#" id="setup-profile">Configurar perfil</a>
        </div>`;
      return;
    }
  }

  const { data: works } = await supabase
    .from("works")
    .select("*")
    .eq("artist_id", artist.id)
    .order("created_at", { ascending: false });

  const isAdvisor = artist.type === "advisor";

  if (main) {
    main.innerHTML = `
      <div class="perfil-header">
        <img src="${artist.image || ''}" alt="${artist.name}" class="perfil-photo">
        <div class="perfil-intro">
          <p class="eyebrow">${isAdvisor ? 'ESPECIALISTA' : 'ARTISTA'}</p>
          <h1>${artist.name}</h1>
          <p class="muted">${isAdvisor ? (artist.title || artist.area || '') : (artist.course || '')}</p>
          <p>${artist.bio || ''}</p>
        </div>
      </div>

      <section class="perfil-stats">
        <div><strong>${works?.length || 0}</strong><small>obras</small></div>
        <div><strong>${(works || []).filter(w => w.status === 'published').length}</strong><small>publicadas</small></div>
        <div><strong>${(works || []).filter(w => w.status === 'draft').length}</strong><small>rascunhos</small></div>
        <div><strong>${(works || []).filter(w => w.visibility === 'private').length}</strong><small>privadas</small></div>
      </section>

      <section class="perfil-section">
        <h2>Publicar nova obra</h2>
        <form id="work-form" class="perfil-form">
          <label><span>Título</span><input type="text" id="work-title" required></label>
          <label><span>Categoria</span>
            <select id="work-category">
              <option value="foto">Fotografia</option>
              <option value="pintura">Pintura</option>
              <option value="desenho">Desenho</option>
              <option value="escultura">Escultura</option>
              <option value="documentario">Documentário</option>
              <option value="video-arte">Videoarte</option>
              <option value="danca">Dança</option>
              <option value="musica">Música</option>
              <option value="teatro">Teatro</option>
              <option value="performance">Performance</option>
              <option value="lipsync">Lipsync</option>
              <option value="literatura">Literatura</option>
              <option value="publicacao">Publicação</option>
              <option value="tcc">TCC</option>
            </select>
          </label>
          <label><span>Ano</span><input type="number" id="work-year" value="${new Date().getFullYear()}"></label>
          <label><span>Descrição</span><textarea id="work-description" rows="3"></textarea></label>
          <label><span>Arquivo (imagem, vídeo ou PDF)</span><input type="file" id="work-file" accept="image/*,video/*,.pdf"></label>
          <label><span>Link do YouTube (vídeos)</span><input type="url" id="work-youtube" placeholder="https://youtube.com/..."></label>
          <label><span>Visibilidade</span>
            <select id="work-visibility">
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </label>
          <label><span>Status</span>
            <select id="work-status">
              <option value="draft">Salvar como rascunho</option>
              <option value="published">Publicar</option>
            </select>
          </label>
          <button type="submit" class="btn btn-dark">Salvar <span>↗</span></button>
        </form>
      </section>

      <section class="perfil-section">
        <h2>Meu acervo</h2>
        <div class="perfil-works" id="perfil-works">
          ${(works || []).map(w => `
            <article class="perfil-work">
              <img src="${w.file_url || ''}" alt="${w.title}">
              <div>
                <strong>${w.title}</strong>
                <small>${w.category} · ${w.year} · ${w.status} · ${w.visibility}</small>
              </div>
            </article>`).join("") || '<p class="muted">Nenhuma obra cadastrada.</p>'}
        </div>
      </section>
    `;

    const form = document.getElementById("work-form");
    if (form) {
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const title = document.getElementById("work-title").value;
        const category = document.getElementById("work-category").value;
        const year = parseInt(document.getElementById("work-year").value);
        const description = document.getElementById("work-description").value;
        const visibility = document.getElementById("work-visibility").value;
        const status = document.getElementById("work-status").value;
        const youtube_url = document.getElementById("work-youtube").value || null;
        const file = document.getElementById("work-file").files[0];

        let file_url = null;
        let file_type = null;

        if (file) {
          const ext = file.name.split(".").pop().toLowerCase();
          if (["jpg","jpeg","png","gif","webp"].includes(ext)) file_type = "image";
          else if (["mp4","mov","webm"].includes(ext)) file_type = "video";
          else if (ext === "pdf") file_type = "pdf";

          const path = `${artist.id}/${Date.now()}_${file.name}`;
          const { error: upErr } = await supabase.storage.from("works").upload(path, file);
          if (!upErr) {
            const { data: { publicUrl } } = supabase.storage.from("works").getPublicUrl(path);
            file_url = publicUrl;
          }
        }

        const { error } = await supabase.from("works").insert({
          artist_id: artist.id,
          title, category, year, description,
          visibility, status, youtube_url,
          file_url, file_type
        });

        if (error) {
          alert("Erro: " + error.message);
        } else {
          location.reload();
        }
      });
    }
  }
})();
