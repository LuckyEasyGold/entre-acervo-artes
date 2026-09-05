// ============================================
// ENTRE — Perfil do usuário logado (painel completo)
// ============================================

(function() {
  const main = document.querySelector(".perfil-main");
  if (!main) return;

  let currentUser = null;
  let artist = null;
  let works = [];
  let currentSection = "profile";

  async function load() {
    const { user } = await window.getCurrentUser();
    if (!user) {
      window.location.href = "welcome.html";
      return;
    }
    currentUser = user;

    const supabase = window.supabaseClient;
    if (!supabase) {
      main.innerHTML = "<p>Supabase não configurado.</p>";
      return;
    }

    const { data: artistData } = await supabase
      .from("artists")
      .select("*")
      .eq("user_id", user.id)
      .single();

    artist = artistData;

    const { data: worksData } = await supabase
      .from("works")
      .select("*")
      .eq("artist_id", artist ? artist.id : "none")
      .order("created_at", { ascending: false });

    works = worksData || [];

    if (!artist) {
      artist = {
        id: null,
        name: "",
        bio: "",
        image: "",
        type: "student",
        course: "",
        title: "",
        area: "",
        curriculum: "",
        subjects: [],
        social: {}
      };
    }

    renderSidebar();
    showSection(currentSection);
  }

  function renderSidebar() {
    const html = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">← Voltar</button>
          <button class="perfil-nav-item active" data-section="profile">Meu Perfil</button>
          <button class="perfil-nav-item" data-section="advisor">Orientador</button>
          <button class="perfil-nav-item" data-section="publish">Publicar obra</button>
          <button class="perfil-nav-item" data-section="works">Meu acervo</button>
          <button class="perfil-nav-item" data-section="security">Segurança</button>
        </aside>
        <div class="perfil-content" id="perfil-content"></div>
      </div>
    `;
    main.innerHTML = html;

    main.querySelectorAll(".perfil-nav-item").forEach(btn => {
      btn.addEventListener("click", () => {
        main.querySelectorAll(".perfil-nav-item").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        showSection(btn.dataset.section);
      });
    });
  }

  function showSection(section) {
    currentSection = section;
    const content = document.getElementById("perfil-content");
    if (!content) return;

    switch (section) {
      case "profile":
        renderProfile(content);
        break;
      case "advisor":
        renderAdvisor(content);
        break;
      case "publish":
        renderPublish(content);
        break;
      case "works":
        renderWorks(content);
        break;
      case "security":
        renderSecurity(content);
        break;
    }
  }

  function renderProfile(container) {
    const a = artist || {};
    const isAdvisor = a.type === "advisor";
    const subtitle = isAdvisor
      ? [a.title, a.area].filter(Boolean).join(" · ")
      : (a.course || "");

    container.innerHTML = `
      <div class="perfil-section">
        <h2>Editar perfil</h2>
        <form id="profile-form" class="perfil-form">
          <label><span>Nome</span><input type="text" id="p-name" value="${escapeHtml(a.name || '')}" required></label>
          <label><span>Bio</span><textarea id="p-bio" rows="3">${escapeHtml(a.bio || '')}</textarea></label>
          <label><span>Foto de perfil (URL)</span><input type="url" id="p-image" value="${escapeHtml(a.image || '')}" placeholder="https://..."></label>
          <label><span>Tipo</span>
            <select id="p-type">
              <option value="student" ${a.type === 'student' ? 'selected' : ''}>Aluno Artista</option>
              <option value="advisor" ${a.type === 'advisor' ? 'selected' : ''}>Orientador</option>
            </select>
          </label>
          <label><span>Curso</span><input type="text" id="p-course" value="${escapeHtml(a.course || '')}" placeholder="Artes Visuais"></label>
          <label><span>Título / Grau</span><input type="text" id="p-title" value="${escapeHtml(a.title || '')}" placeholder="Ex.: Mestre, Doutor..."></label>
          <label><span>Área de atuação</span><input type="text" id="p-area" value="${escapeHtml(a.area || '')}" placeholder="Pintura contemporânea"></label>
          <label><span>Currículo</span><textarea id="p-curriculum" rows="4">${escapeHtml(a.curriculum || '')}</textarea></label>
          <label><span>Disciplinas (separadas por vírgula)</span><input type="text" id="p-subjects" value="${escapeHtml((a.subjects || []).join(', '))}" placeholder="Pintura I, Gravura..."></label>
          <button type="submit" class="btn btn-dark">Salvar perfil</button>
        </form>
      </div>
    `;

    document.getElementById("profile-form").addEventListener("submit", async e => {
      e.preventDefault();
      const data = {
        name: document.getElementById("p-name").value.trim(),
        bio: document.getElementById("p-bio").value.trim(),
        image: document.getElementById("p-image").value.trim(),
        type: document.getElementById("p-type").value,
        course: document.getElementById("p-course").value.trim(),
        title: document.getElementById("p-title").value.trim(),
        area: document.getElementById("p-area").value.trim(),
        curriculum: document.getElementById("p-curriculum").value.trim(),
        subjects: document.getElementById("p-subjects").value.split(",").map(s => s.trim()).filter(Boolean),
        updated_at: new Date().toISOString()
      };

      if (artist && artist.id) {
        const { error } = await supabase.from("artists").update(data).eq("id", artist.id);
        if (error) {
          alert("Erro ao salvar: " + error.message);
        } else {
          artist = { ...artist, ...data };
          alert("Perfil atualizado!");
        }
      } else {
        const { data: inserted, error } = await supabase.from("artists").insert({
          ...data,
          user_id: currentUser.id
        }).select().single();
        if (error) {
          alert("Erro ao criar perfil: " + error.message);
        } else {
          artist = inserted;
          alert("Perfil criado!");
        }
      }
    });
  }

  function renderPublish(container) {
    if (!artist || !artist.id) {
      container.innerHTML = `<div class="perfil-section"><p>Você precisa completar seu perfil antes de publicar.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="perfil-section">
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
          <label><span>Link do YouTube</span><input type="url" id="work-youtube" placeholder="https://youtube.com/..."></label>
          <label><span>Visibilidade</span>
            <select id="work-visibility">
              <option value="public">Pública</option>
              <option value="private">Privada</option>
            </select>
          </label>
          <label><span>Status</span>
            <select id="work-status">
              <option value="draft">Rascunho</option>
              <option value="published">Publicar</option>
            </select>
          </label>
          <button type="submit" class="btn btn-dark">Salvar <span>↗</span></button>
        </form>
      </div>
    `;

    document.getElementById("work-form").addEventListener("submit", async e => {
      e.preventDefault();
      const title = document.getElementById("work-title").value.trim();
      const category = document.getElementById("work-category").value;
      const year = parseInt(document.getElementById("work-year").value);
      const description = document.getElementById("work-description").value.trim();
      const visibility = document.getElementById("work-visibility").value;
      const status = document.getElementById("work-status").value;
      const youtube_url = document.getElementById("work-youtube").value.trim() || null;
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
        alert("Obra salva!");
        showSection("works");
      }
    });
  }

  function renderWorks(container) {
    const list = (works || []).map(w => `
      <article class="perfil-work">
        <img src="${w.file_url || ''}" alt="${escapeHtml(w.title || '')}">
        <div>
          <strong>${escapeHtml(w.title || '')}</strong>
          <small>${w.category || ''} · ${w.year || ''} · ${w.status || ''} · ${w.visibility || ''}</small>
        </div>
      </article>
    `).join("") || '<p class="muted">Nenhuma obra cadastrada.</p>';

    container.innerHTML = `
      <div class="perfil-section">
        <h2>Meu acervo</h2>
        <div class="perfil-works">${list}</div>
      </div>
    `;
  }

  function renderSecurity(container) {
    container.innerHTML = `
      <div class="perfil-section">
        <h2>Alterar senha</h2>
        <form id="password-form" class="perfil-form">
          <label><span>Senha atual</span><input type="password" id="sec-current-password" required></label>
          <label><span>Nova senha</span><input type="password" id="sec-new-password" required minlength="6"></label>
          <button type="submit" class="btn btn-dark">Atualizar senha</button>
        </form>
      </div>
      <div class="perfil-section">
        <h2>Alterar e-mail</h2>
        <form id="email-form" class="perfil-form">
          <label><span>Novo e-mail</span><input type="email" id="sec-new-email" required></label>
          <button type="submit" class="btn btn-dark">Atualizar e-mail</button>
        </form>
      </div>
    `;

    document.getElementById("password-form").addEventListener("submit", async e => {
      e.preventDefault();
      const currentPassword = document.getElementById("sec-current-password").value;
      const newPassword = document.getElementById("sec-new-password").value;

      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Senha atualizada!");
          document.getElementById("password-form").reset();
        }
      } catch (err) {
        alert("Erro: " + err.message);
      }
    });

    document.getElementById("email-form").addEventListener("submit", async e => {
      e.preventDefault();
      const newEmail = document.getElementById("sec-new-email").value.trim();

      try {
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("E-mail atualizado! Você pode precisar confirmar o novo e-mail.");
          document.getElementById("email-form").reset();
        }
      } catch (err) {
        alert("Erro: " + err.message);
      }
    });
  }

  function renderAdvisor(container) {
    if (!artist || !artist.id) {
      container.innerHTML = "<p>Complete seu perfil primeiro.</p>";
      return;
    }

    const { data: advisors } = await supabase
      .from("artists")
      .select("id, name, area, title")
      .eq("type", "advisor")
      .eq("status", "approved");

    const currentAdvisor = artist.advisor_id
      ? advisors?.find(a => a.id === artist.advisor_id)
      : null;

    let html = `
      <div class="perfil-section">
        <h2>Meu orientador</h2>
        <p class="muted">Escolha um orientador responsável por suas publicações.</p>
    `;

    if (currentAdvisor) {
      html += `
        <div class="perfil-work" style="margin-bottom:16px;">
          <strong>${currentAdvisor.name}</strong>
          <small>${currentAdvisor.title || ''} · ${currentAdvisor.area || ''}</small>
        </div>
      `;
    }

    html += `
        <form id="advisor-form" class="perfil-form">
          <label><span>Orientador</span>
            <select id="advisor-select">
              <option value="">Selecione um orientador...</option>
              ${(advisors || []).map(a => `
                <option value="${a.id}" ${a.id === artist.advisor_id ? 'selected' : ''}>${a.name} — ${a.area || a.title || ''}</option>
              `).join("")}
            </select>
          </label>
          <label><span>Mensagem (opcional)</span>
            <textarea id="advisor-message" rows="2" placeholder="Gostaria de ser orientado por você..."></textarea>
          </label>
          <button type="submit" class="btn btn-dark">Solicitar orientação</button>
        </form>
      </div>
    `;

    container.innerHTML = html;

    const form = document.getElementById("advisor-form");
    if (form) {
      form.addEventListener("submit", async e => {
        e.preventDefault();
        const advisorId = document.getElementById("advisor-select").value;
        const message = document.getElementById("advisor-message").value.trim();

        if (!advisorId) {
          alert("Selecione um orientador.");
          return;
        }

        const requestId = "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
        const { error } = await supabase
          .from("advisor_requests")
          .insert({
            id: requestId,
            artist_id: artist.id,
            advisor_id: advisorId,
            message: message,
            status: "pending"
          });

        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Solicitação enviada! Aguarde o orientador aprovar.");
          form.reset();
        }
      });
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  load();
})();
