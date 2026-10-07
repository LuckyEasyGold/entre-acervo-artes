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

  function normalizeRole(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isAdvisorProfile(profile) {
    if (!profile) return false;
    const role = normalizeRole(profile.role);
    const type = normalizeRole(profile.type);
    return type === "advisor" || role === "orientador" || role === "orientadora" || role === "adm" || role === "moderador";
  }

  async function load() {
    const supabase = window.supabaseClient;
    if (!supabase) {
      console.warn("[perfil] supabase client ainda não disponível");
      return;
    }

    const { user } = await window.getCurrentUser();
    if (!user) {
      window.location.href = "welcome.html";
      return;
    }
    currentUser = user;

    let artistData = null;
    try {
      const { data } = await window.supabaseClient
        .from("artists")
        .select("*")
        .eq("user_id", user.id)
        .single();
      artistData = data;
    } catch (err) {
      console.warn("[perfil] load artist warning:", err);
    }

    artist = artistData;

    let worksData = [];
    try {
      const { data } = await window.supabaseClient
        .from("works")
        .select("*")
        .eq("artist_id", artist ? artist.id : "none")
        .order("created_at", { ascending: false });
      worksData = data || [];
    } catch (err) {
      console.warn("[perfil] load works warning:", err);
    }

    works = worksData;

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
    const isAdvisor = isAdvisorProfile(artist);
    const html = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">← Voltar</button>
          <button class="perfil-nav-item active" data-section="profile">Meu Perfil</button>
          ${isAdvisor ? '<button class="perfil-nav-item" data-section="disciplines">Minhas Disciplinas</button>' : '<button class="perfil-nav-item" data-section="orientation">Disciplinas e Orientação</button>'}
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
      case "disciplines":
        renderDisciplines(content);
        break;
      case "orientation":
        window.location.href = "orientacao.html";
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
    const isAdvisor = isAdvisorProfile(a);
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
            <label><span>Ou carregar do computador</span><input type="file" id="p-image-file" accept="image/*"></label>
            <div id="profile-upload-status" style="display:none; margin:8px 0; color:#6b4f00; font-size:0.9rem; font-weight:600;"></div>
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
        const fileInput = document.getElementById("p-image-file");
        const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;
        const uploadStatus = document.getElementById("profile-upload-status");
        const submitButton = e.target.querySelector('button[type="submit"]');

        const setUploadStatus = (message, isError = false) => {
          if (!uploadStatus) return;
          uploadStatus.style.display = "block";
          uploadStatus.textContent = message;
          uploadStatus.style.color = isError ? "#a42727" : "#6b4f00";
        };

        let finalImage = document.getElementById("p-image").value.trim();

        try {
          if (file) {
            setUploadStatus("Enviando foto de perfil...");
            if (submitButton) submitButton.disabled = true;

            const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
            const path = `${currentUser.id}/avatars/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
            const { error: uploadError } = await window.supabaseClient.storage.from("avatars").upload(path, file, {
              cacheControl: "3600",
              upsert: true
            });

            if (uploadError) {
              setUploadStatus("Não foi possível enviar a foto de perfil. Verifique o bucket de imagens e as permissões do Supabase.", true);
              throw new Error("Não foi possível enviar a foto de perfil. Crie o bucket 'avatars' no Supabase e verifique as políticas de storage. " + (uploadError.message || ""));
            }

            const { data: publicData } = window.supabaseClient.storage.from("avatars").getPublicUrl(path);
            finalImage = publicData?.publicUrl || finalImage;
            setUploadStatus("Foto enviada. Salvando perfil...");
          }

          const data = {
            name: document.getElementById("p-name").value.trim(),
            bio: document.getElementById("p-bio").value.trim(),
            image: finalImage,
            course: document.getElementById("p-course").value.trim(),
            title: document.getElementById("p-title").value.trim(),
            area: document.getElementById("p-area").value.trim(),
            curriculum: document.getElementById("p-curriculum").value.trim(),
            subjects: document.getElementById("p-subjects").value.split(",").map(s => s.trim()).filter(Boolean),
            updated_at: new Date().toISOString()
          };

          if (artist && artist.id) {
            const { error } = await window.supabaseClient.from("artists").update(data).eq("id", artist.id);
            if (error) throw error;
            artist = { ...artist, ...data };
            setUploadStatus("Perfil atualizado com sucesso!");
            alert("Perfil atualizado!");
          } else {
            const payload = {
              ...data,
              user_id: currentUser.id,
              type: "student",
              role: "artista",
              status: "pending",
              id: "artist-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8)
            };
            const { data: inserted, error } = await window.supabaseClient.from("artists").insert(payload).select().single();
            if (error) throw error;
            artist = inserted;
            setUploadStatus("Perfil criado com sucesso!");
            alert("Perfil criado!");
          }
        } catch (err) {
          setUploadStatus("Não foi possível salvar o perfil. Verifique os dados e tente novamente.", true);
          alert("Erro: " + err.message);
          console.error("[perfil] save error:", err);
        } finally {
          if (submitButton) submitButton.disabled = false;
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
        <p class="muted">
          Obras podem ser salvas como rascunho ou publicadas diretamente.
        </p>
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
          <label><span>Link da imagem (Pinterest público)</span><input type="url" id="work-image" placeholder="https://pinterest.com/pin/..."></label>
          <label><span>Link do YouTube (vídeo público)</span><input type="url" id="work-youtube" placeholder="https://youtube.com/..."></label>
          <label><span>Arquivo (imagem, vídeo ou PDF)</span><input type="file" id="work-file" accept="image/*,video/*,.pdf"></label>
          <div id="work-upload-status" style="display:none; margin:8px 0; color:#6b4f00; font-size:0.9rem; font-weight:600;"></div>
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
      </div>
    `;

    document.getElementById("work-form").addEventListener("submit", async e => {
      e.preventDefault();
      const uploadStatus = document.getElementById("work-upload-status");
      const submitButton = e.target.querySelector('button[type="submit"]');
      const setUploadStatus = (message, isError = false) => {
        if (!uploadStatus) return;
        uploadStatus.style.display = "block";
        uploadStatus.textContent = message;
        uploadStatus.style.color = isError ? "#a42727" : "#6b4f00";
      };

      const title = document.getElementById("work-title").value.trim();
      const category = document.getElementById("work-category").value;
      const year = parseInt(document.getElementById("work-year").value);
      const description = document.getElementById("work-description").value.trim();
      const visibility = document.getElementById("work-visibility").value;
      const status = document.getElementById("work-status").value;
      const youtube_url = document.getElementById("work-youtube").value.trim() || null;
      const imageUrl = document.getElementById("work-image").value.trim() || null;
      const file = document.getElementById("work-file").files[0];

      if (!imageUrl && !file && !youtube_url) {
        alert("Selecione uma imagem, um arquivo ou um link de vídeo para publicar a obra.");
        return;
      }

      let file_url = null;
      let file_type = null;

      try {
        if (file) {
          setUploadStatus("Enviando arquivo...");
          if (submitButton) submitButton.disabled = true;

          const ext = file.name.split(".").pop().toLowerCase();
          if (["jpg","jpeg","png","gif","webp"].includes(ext)) file_type = "image";
          else if (["mp4","mov","webm"].includes(ext)) file_type = "video";
          else if (ext === "pdf") file_type = "pdf";

          const path = `${artist.id}/${Date.now()}_${file.name}`;
          const { error: upErr } = await window.supabaseClient.storage.from("works").upload(path, file);
          if (upErr) {
            setUploadStatus("Não foi possível enviar o arquivo. Verifique a pasta de arquivos e as permissões do Supabase.", true);
            throw new Error("Não foi possível enviar o arquivo para o armazenamento. " + (upErr.message || ""));
          }

          const { data: { publicUrl } } = window.supabaseClient.storage.from("works").getPublicUrl(path);
          file_url = publicUrl;
          setUploadStatus("Arquivo enviado. Salvando obra...");
        }

        const workId = "work-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

        const { error } = await window.supabaseClient.from("works").insert({
          id: workId,
          artist_id: artist.id,
          advisor_id: artist.advisor_id || null,
          title, category, year, description,
          visibility, status, youtube_url,
          image: imageUrl || file_url,
          file_url, file_type
        });

        if (error) throw error;
        const { data: refreshedWorks } = await window.supabaseClient
          .from("works")
          .select("*")
          .eq("artist_id", artist.id)
          .order("created_at", { ascending: false });
        works = refreshedWorks || works;
        setUploadStatus("Obra salva com sucesso!");
        alert("Obra salva!");
        showSection("works");
      } catch (err) {
        setUploadStatus("Não foi possível salvar a obra. Verifique os dados e tente novamente.", true);
        alert("Erro: " + err.message);
        console.error("[perfil] work save error:", err);
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  function renderWorks(container) {
    const list = (works || []).map(w => `
      <article class="perfil-work" data-id="${w.id}">
        <img src="${escapeHtml(w.image || w.file_url || '')}" alt="${escapeHtml(w.title || '')}">
        <div>
          <strong>${escapeHtml(w.title || '')}</strong>
          <small>${w.category || ''} · ${w.year || ''} · ${w.status || ''} · ${w.visibility || ''}</small>
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            <button type="button" class="btn btn-sm btn-dark edit-work" data-id="${w.id}">Editar</button>
            <button type="button" class="btn btn-sm btn-outline delete-work" data-id="${w.id}">Excluir</button>
          </div>
        </div>
      </article>
    `).join("") || '<p class="muted">Nenhuma obra cadastrada.</p>';

    container.innerHTML = `
      <div class="perfil-section">
        <h2>Meu acervo</h2>
        <div class="perfil-works">${list}</div>
      </div>
    `;

    container.querySelectorAll(".delete-work").forEach(button => {
      button.addEventListener("click", async () => {
        const workId = button.dataset.id;
        if (!workId) return;
        const confirmed = window.confirm("Tem certeza que deseja excluir esta obra do seu acervo?");
        if (!confirmed) return;

        const { error } = await window.supabaseClient
          .from("works")
          .delete()
          .eq("id", workId);

        if (error) {
          alert("Erro ao excluir obra: " + error.message);
          return;
        }

        works = (works || []).filter(w => w.id !== workId);
        renderWorks(container);
      });
    });

    container.querySelectorAll(".edit-work").forEach(button => {
      button.addEventListener("click", async () => {
        const workId = button.dataset.id;
        const entry = (works || []).find(w => w.id === workId);
        if (!entry) return;

        const nextTitle = window.prompt("Título da obra:", entry.title || "");
        if (nextTitle === null) return;

        const nextDescription = window.prompt("Descrição da obra:", entry.description || "");
        if (nextDescription === null) return;

        const nextYear = window.prompt("Ano da obra:", String(entry.year || new Date().getFullYear()));
        if (nextYear === null) return;

        const payload = {
          title: nextTitle.trim() || entry.title,
          description: nextDescription.trim() || entry.description,
          year: Number(nextYear) || entry.year || new Date().getFullYear(),
          updated_at: new Date().toISOString()
        };

        const { error } = await window.supabaseClient
          .from("works")
          .update(payload)
          .eq("id", workId);

        if (error) {
          alert("Erro ao atualizar obra: " + error.message);
          return;
        }

        works = (works || []).map(w => w.id === workId ? { ...w, ...payload } : w);
        renderWorks(container);
      });
    });
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

  async function renderDisciplines(container) {
    const a = artist || {};
    if (!a.id) {
      container.innerHTML = "<p>Complete seu perfil primeiro.</p>";
      return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      container.innerHTML = "<p>Supabase não configurado.</p>";
      return;
    }

    const { data: disciplines } = await supabase
      .from("disciplines")
      .select("*")
      .eq("advisor_id", a.id)
      .order("created_at", { ascending: false });

    const disciplineIds = (disciplines || []).map(d => d.id);
    let enrollments = [];
    if (disciplineIds.length > 0) {
      const { data } = await supabase
        .from("enrollments")
        .select("*, artist:artists(id, name, course)")
        .in("discipline_id", disciplineIds)
        .order("created_at", { ascending: true });
      enrollments = data || [];
    }

    container.innerHTML = `
      <div class="perfil-section">
        <h2>Minhas disciplinas</h2>
        <p class="muted">Crie disciplinas e gerencie inscrições de alunos.</p>
        <button class="btn btn-dark" id="create-disc-btn" style="margin-bottom:16px;">Criar disciplina</button>
        <div id="disc-form" style="display:none; margin-bottom:16px;">
          <form id="discipline-form" class="perfil-form">
            <label><span>Nome</span><input type="text" id="disc-name" required></label>
            <label><span>Descrição</span><textarea id="disc-description" rows="3"></textarea></label>
            <button type="submit" class="btn btn-dark">Salvar</button>
          </form>
        </div>
        <div class="perfil-works">
          ${(disciplines || []).map(d => `
            <article class="perfil-work disciplina-card" data-id="${d.id}">
              <div>
                <strong>${escapeHtml(d.name)}</strong>
                <small>${d.status === 'active' ? 'Ativa' : 'Fechada'} · ${new Date(d.created_at).toLocaleDateString()}</small>
                <p>${escapeHtml(d.description || '')}</p>
                <div class="discipline-actions">
                  <button class="action-btn toggle-disc" data-id="${d.id}" data-status="${d.status}">
                    ${d.status === 'active' ? 'Fechar' : 'Reabrir'}
                  </button>
                  <button class="action-btn edit-disc" data-id="${d.id}">Editar</button>
                  <button class="action-btn delete-disc" data-id="${d.id}">Excluir</button>
                </div>
                <form class="perfil-form discipline-editor" data-id="${d.id}" style="display:none; margin-top:12px;">
                  <label><span>Nome</span><input type="text" name="name" value="${escapeHtml(d.name || '')}" required></label>
                  <label><span>Descrição</span><textarea name="description" rows="3">${escapeHtml(d.description || '')}</textarea></label>
                  <div class="discipline-editor-actions">
                    <button type="submit" class="action-btn save-disc">Salvar</button>
                    <button type="button" class="action-btn cancel-edit">Cancelar</button>
                  </div>
                </form>
              </div>
            </article>
          `).join("") || "<p>Você ainda não criou disciplinas.</p>"}
        </div>
        <h3 style="margin-top:32px;">Inscrições</h3>
        <div class="perfil-works">
          ${(enrollments || []).map(e => `
            <article class="perfil-work">
              <div>
                <strong>${escapeHtml(e.artist?.name || 'Aluno')}</strong>
                <small>${escapeHtml(e.artist?.course || '')} · ${escapeHtml(e.status)}</small>
                <p>${escapeHtml(e.message || '')}</p>
                ${e.status === 'pending' ? `
                  <div style="margin-top:10px; display:flex; gap:8px;">
                    <button class="btn btn-sm btn-dark approve-enr" data-id="${e.id}">Aprovar</button>
                    <button class="btn btn-sm btn-outline reject-enr" data-id="${e.id}">Recusar</button>
                  </div>
                ` : ''}
              </div>
            </article>
          `).join("") || "<p>Nenhuma inscrição.</p>"}
        </div>
      </div>
    `;

    const createBtn = document.getElementById("create-disc-btn");
    const formDiv = document.getElementById("disc-form");
    if (createBtn && formDiv) {
      createBtn.addEventListener("click", () => {
        formDiv.style.display = formDiv.style.display === "none" ? "block" : "none";
      });

      const discForm = document.getElementById("discipline-form");
      if (discForm) {
        discForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const name = document.getElementById("disc-name").value.trim();
          const description = document.getElementById("disc-description").value.trim();
          const id = "disc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

          const { error } = await supabase.from("disciplines").insert({
            id,
            advisor_id: a.id,
            name,
            description,
            status: "active"
          });

          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Disciplina criada!");
            window.location.reload();
          }
        });
      }
    }

    container.querySelectorAll(".toggle-disc").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const status = btn.dataset.status === "active" ? "closed" : "active";
        const { error } = await supabase
          .from("disciplines")
          .update({ status })
          .eq("id", id);
        if (error) {
          alert("Erro: " + error.message);
        } else {
          window.location.reload();
        }
      });
    });

    container.querySelectorAll(".edit-disc").forEach(btn => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".disciplina-card");
        const form = card ? card.querySelector(".discipline-editor") : null;
        if (!form) return;
        form.style.display = form.style.display === "none" ? "block" : "none";
      });
    });

    container.querySelectorAll(".discipline-editor").forEach(form => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = form.dataset.id;
        const name = form.querySelector('[name="name"]').value.trim();
        const description = form.querySelector('[name="description"]').value.trim();

        if (!name) {
          alert("Preencha o nome da disciplina.");
          return;
        }

        const { error } = await supabase
          .from("disciplines")
          .update({
            name,
            description,
            updated_at: new Date().toISOString()
          })
          .eq("id", id);

        if (error) {
          alert("Erro ao atualizar disciplina: " + error.message);
          return;
        }

        window.location.reload();
      });

      const cancelBtn = form.querySelector(".cancel-edit");
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          form.style.display = "none";
        });
      }
    });

    container.querySelectorAll(".delete-disc").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const confirmed = window.confirm("Tem certeza que deseja excluir esta disciplina?");
        if (!confirmed) return;

        const { error } = await supabase
          .from("disciplines")
          .delete()
          .eq("id", id);

        if (error) {
          alert("Erro ao excluir disciplina: " + error.message);
          return;
        }

        window.location.reload();
      });
    });

    container.querySelectorAll(".approve-enr").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const { error } = await supabase
          .from("enrollments")
          .update({ status: "approved" })
          .eq("id", id);
        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Inscrição aprovada!");
          window.location.reload();
        }
      });
    });

    container.querySelectorAll(".reject-enr").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const { error } = await supabase
          .from("enrollments")
          .update({ status: "rejected" })
          .eq("id", id);
        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Inscrição recusada!");
          window.location.reload();
        }
      });
    });
  }

  function renderSecurity(container) {
    const a = artist || {};
    container.innerHTML = `
      <div class="perfil-section">
        <h2>Segurança e conta</h2>
        <div class="perfil-works">
          <article class="perfil-work">
            <div>
              <strong>Alterar senha</strong>
              <form id="password-form" class="perfil-form" style="margin-top:10px;">
                <label><span>Senha atual</span><input type="password" id="sec-current-password" required></label>
                <label><span>Nova senha</span><input type="password" id="sec-new-password" required minlength="6"></label>
                <button type="submit" class="btn btn-dark">Atualizar senha</button>
              </form>
            </div>
          </article>
          <article class="perfil-work" style="margin-top:20px;">
            <div>
              <strong>Alterar e-mail</strong>
              <form id="email-form" class="perfil-form" style="margin-top:10px;">
                <label><span>Novo e-mail</span><input type="email" id="sec-new-email" required></label>
                <button type="submit" class="btn btn-dark">Atualizar e-mail</button>
              </form>
            </div>
          </article>
          <article class="perfil-work" style="margin-top:20px; border-color:#ef4444;">
            <div>
              <strong>Desativar conta</strong>
              <p class="muted">Você pode desativar sua conta a qualquer momento. Ela ficará oculta, mas os dados serão mantidos para fins legais.</p>
              <button class="btn btn-outline" id="disable-account-btn" style="margin-top:10px; border-color:#ef4444; color:#ef4444;">Desativar minha conta</button>
            </div>
          </article>
          <article class="perfil-work" style="margin-top:20px; border-color:#ef4444;">
            <div>
              <strong>Solicitar exclusão (LGPD)</strong>
              <p class="muted">Solicite a exclusão definitiva dos seus dados pessoais conforme a LGPD.</p>
              <button class="btn btn-outline" id="delete-account-btn" style="margin-top:10px; border-color:#ef4444; color:#ef4444;">Solicitar exclusão</button>
            </div>
          </article>
        </div>
      </div>
    `;

    const passwordForm = document.getElementById("password-form");
    if (passwordForm) {
      passwordForm.addEventListener("submit", async e => {
        e.preventDefault();
        const currentPassword = document.getElementById("sec-current-password").value;
        const newPassword = document.getElementById("sec-new-password").value;

        try {
          const { error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Senha atualizada!");
            passwordForm.reset();
          }
        } catch (err) {
          alert("Erro: " + err.message);
        }
      });
    }

    const emailForm = document.getElementById("email-form");
    if (emailForm) {
      emailForm.addEventListener("submit", async e => {
        e.preventDefault();
        const newEmail = document.getElementById("sec-new-email").value.trim();

        try {
          const { error } = await window.supabaseClient.auth.updateUser({ email: newEmail });
          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("E-mail atualizado!");
            emailForm.reset();
          }
        } catch (err) {
          alert("Erro: " + err.message);
        }
      });
    }

    const disableBtn = document.getElementById("disable-account-btn");
    if (disableBtn) {
      disableBtn.addEventListener("click", async () => {
        const confirm = window.confirm("Tem certeza que deseja desativar sua conta? Você não poderá acessá-la até que seja reativada por um moderador.");
        if (!confirm) return;

        const { error } = await window.supabaseClient
          .from("artists")
          .update({ disabled: true, disabled_reason: "Desativada pelo próprio usuário" })
          .eq("id", artist.id);

        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Conta desativada. Você será redirecionado.");
          window.location.href = "home.html";
        }
      });
    }

    const deleteBtn = document.getElementById("delete-account-btn");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", async () => {
        const confirm = window.confirm("Tem certeza que deseja solicitar a exclusão dos seus dados? Esta ação não pode ser desfeita.");
        if (!confirm) return;

        const reason = prompt("Motivo da solicitação (opcional):") || "";

        const { error } = await window.supabaseClient
          .from("artists")
          .update({ disabled: true, disabled_reason: "Solicitação de exclusão LGPD: " + reason })
          .eq("id", artist.id);

        if (error) {
          alert("Erro: " + error.message);
        } else {
          alert("Solicitação enviada! Nossa equipe entrará em contato em até 30 dias.");
        }
      });
    }
  }

  (async function boot() {
    try {
      while (typeof window.getCurrentUser !== "function") {
        await new Promise(r => setTimeout(r, 50));
      }
      await window.initAuthGuard();
      await load();
    } catch (err) {
      console.error("[perfil] boot error:", err);
      if (main) {
        main.innerHTML = '<div class="perfil-section"><p class="auth-error">Erro ao carregar perfil: ' + escapeHtml(err.message) + '</p></div>';
      }
    }
  })();
})();
