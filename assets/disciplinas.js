// ============================================
// ENTRE — Disciplinas (orientador)
// ============================================

(async function() {
  function escapeHtml(text) {
    if (text == null) return "";
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  const main = document.getElementById("perfil-main");
  if (!main) return;

  try {
    while (typeof window.getCurrentUser !== "function") {
      await new Promise(r => setTimeout(r, 50));
    }
    await window.initAuthGuard();

    const { user } = await window.getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
      main.innerHTML = "<p>Supabase não configurado.</p>";
      return;
    }

    let me = null;
    try {
      const { data } = await supabase
        .from("artists")
        .select("id, role, type, status")
        .eq("user_id", user.id)
        .single();
      me = data;
    } catch (err) {
      console.warn("[disciplinas] perfil do orientador não encontrado:", err);
    }

    const normalizedRole = String(me && me.role ? me.role : "").trim().toLowerCase();
    const isAdvisorProfile = !!me && (
      me.type === "advisor" ||
      normalizedRole === "orientador" ||
      normalizedRole === "orientadora" ||
      normalizedRole === "adm" ||
      normalizedRole === "moderador"
    );

    if (!me || !isAdvisorProfile) {
      main.innerHTML = "<p>Seu perfil de orientador não foi encontrado ou não está validado. Complete seu perfil em Meu Perfil e verifique se o tipo está como orientador.</p>";
      return;
    }

    const { data: disciplines } = await supabase
      .from("disciplines")
      .select("*")
      .eq("advisor_id", me.id)
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

    main.innerHTML = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">← Voltar</button>
          <button class="perfil-nav-item active" data-section="list">Minhas disciplinas</button>
          <button class="perfil-nav-item" data-section="new">Criar disciplina</button>
          <button class="perfil-nav-item" data-section="enrollments">Inscrições (${enrollments?.filter(e => e.status === 'pending').length || 0})</button>
        </aside>
        <div class="perfil-content" id="perfil-content"></div>
      </div>
    `;

    const content = document.getElementById("perfil-content");
    const navItems = main.querySelectorAll(".perfil-nav-item");

    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        navItems.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const section = btn.dataset.section;
        if (section === "list") renderList();
        if (section === "new") renderForm();
        if (section === "enrollments") renderEnrollments();
      });
    });

    function renderList() {
      if (!content) return;
      if (!disciplines || !disciplines.length) {
        content.innerHTML = "<p>Você ainda não criou disciplinas.</p>";
        return;
      }
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Minhas disciplinas</h2>
          <div class="perfil-works">
            ${disciplines.map(d => `
              <article class="perfil-work">
                <div>
                  <strong>${escapeHtml(d.name)}</strong>
                  <small>${d.status === 'active' ? 'Ativa' : 'Fechada'} · ${new Date(d.created_at).toLocaleDateString()}</small>
                  <p>${escapeHtml(d.description || '')}</p>
                  <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn btn-sm btn-dark toggle-disc" data-id="${d.id}" data-status="${d.status}">${d.status === 'active' ? 'Fechar' : 'Reabrir'}</button>
                    <button class="btn btn-sm btn-dark edit-disc" data-id="${d.id}">Editar</button>
                    <button class="btn btn-sm btn-outline delete-disc" data-id="${d.id}">Excluir</button>
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `;

      content.querySelectorAll(".toggle-disc").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const status = btn.dataset.status === "active" ? "closed" : "active";
          const { error } = await supabase.from("disciplines").update({ status }).eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            window.location.reload();
          }
        });
      });

      content.querySelectorAll(".edit-disc").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const discipline = disciplines.find(d => d.id === id);
          if (!discipline) return;
          const name = window.prompt("Nome da disciplina:", discipline.name || "");
          if (name === null) return;
          const description = window.prompt("Descrição da disciplina:", discipline.description || "");
          if (description === null) return;
          const { error } = await supabase.from("disciplines").update({
            name: name.trim() || discipline.name,
            description: description.trim() || discipline.description,
            updated_at: new Date().toISOString()
          }).eq("id", id);
          if (error) {
            alert("Erro ao atualizar disciplina: " + error.message);
          } else {
            window.location.reload();
          }
        });
      });

      content.querySelectorAll(".delete-disc").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const confirmed = window.confirm("Tem certeza que deseja excluir esta disciplina?");
          if (!confirmed) return;
          const { error } = await supabase.from("disciplines").delete().eq("id", id);
          if (error) {
            alert("Erro ao excluir disciplina: " + error.message);
          } else {
            window.location.reload();
          }
        });
      });
    }

    function renderForm() {
      if (!content) return;
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Criar nova disciplina</h2>
          <form id="discipline-form" class="perfil-form">
            <label><span>Nome</span><input type="text" id="disc-name" required></label>
            <label><span>Descrição</span><textarea id="disc-description" rows="3"></textarea></label>
            <button type="submit" class="btn btn-dark">Criar disciplina</button>
          </form>
        </div>
      `;

      document.getElementById("discipline-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("disc-name").value.trim();
        const description = document.getElementById("disc-description").value.trim();
        const id = "disc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);

        const { error } = await supabase.from("disciplines").insert({
          id,
          advisor_id: me.id,
          name,
          description,
          status: "active"
        });

        if (error) {
          if ((error.message || "").toLowerCase().includes("row-level security") || (error.message || "").toLowerCase().includes("forbidden")) {
            alert(
              "Não foi possível criar a disciplina porque seu perfil de orientador não está validado no sistema. Isso acontece quando o usuário logado não tem um registro correspondente em public.artists, ou quando o perfil existe mas não bate com o identificador do orientador. Em outras palavras: o sistema reconheceu que você entrou, mas não reconheceu que você é um orientador autorizado para criar disciplinas."
            );
          } else {
            alert("Não foi possível criar a disciplina. Tente novamente em alguns instantes.");
          }
        } else {
          alert("Disciplina criada!");
          window.location.reload();
        }
      });
    }

    function renderEnrollments() {
      if (!content) return;
      const pending = (enrollments || []).filter(e => e.status === "pending");
      const others = (enrollments || []).filter(e => e.status !== "pending");

      content.innerHTML = `
        <div class="perfil-section">
          <h2>Inscrições pendentes</h2>
          <p class="muted">Alunos que solicitaram inscrição nas suas disciplinas.</p>
          <div class="perfil-works">
            ${pending.map(e => `
              <article class="perfil-work">
                <div>
                  <strong>${escapeHtml(e.artist?.name || 'Aluno')}</strong>
                  <small>${escapeHtml(e.artist?.course || '')}</small>
                  <p>${escapeHtml(e.message || '')}</p>
                  <div style="margin-top:10px; display:flex; gap:8px;">
                    <button class="btn btn-sm btn-dark approve-enrollment" data-id="${e.id}">Aprovar</button>
                    <button class="btn btn-sm btn-outline reject-enrollment" data-id="${e.id}">Recusar</button>
                  </div>
                </div>
              </article>
            `).join("") || "<p>Nenhuma inscrição pendente.</p>"}
          </div>
        </div>
        <div class="perfil-section">
          <h2>Todas as inscrições</h2>
          <div class="perfil-works">
            ${others.map(e => `
              <article class="perfil-work">
                <div>
                  <strong>${escapeHtml(e.artist?.name || 'Aluno')}</strong>
                  <small>${escapeHtml(e.artist?.course || '')} · ${escapeHtml(e.status)}</small>
                </div>
              </article>
            `).join("") || "<p>Nenhuma inscrição.</p>"}
          </div>
        </div>
      `;

      content.querySelectorAll(".approve-enrollment").forEach(btn => {
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

      content.querySelectorAll(".reject-enrollment").forEach(btn => {
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

    renderList();
  } catch (err) {
    console.error("[disciplinas] error:", err);
    if (main) {
      main.innerHTML = '<p class="auth-error">Erro ao carregar disciplinas: ' + err.message + '</p>';
    }
  }
})();
