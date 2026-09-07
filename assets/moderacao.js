// ============================================
// ENTRE — Moderação de usuários + eleição de moderador
// ============================================

(async function() {
  const main = document.getElementById("perfil-main");
  const errorEl = document.getElementById("mod-error");
  const loadingEl = document.getElementById("mod-loading");
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
      if (main) main.innerHTML = "<p>Supabase não configurado.</p>";
      return;
    }

    const { data: me } = await supabase
      .from("artists")
      .select("id, role, status, type, disabled")
      .eq("user_id", user.id)
      .single();

    if (!me || !["adm", "moderador", "orientador"].includes(me.role)) {
      if (main) main.innerHTML = "<p>Acesso restrito.</p>";
      return;
    }

    if (me.disabled) {
      if (main) main.innerHTML = "<p>Sua conta está desativada.</p>";
      return;
    }

    const { data: pending } = await supabase
      .from("artists")
      .select("id, name, type, role, status, created_at, moderator_votes, disabled")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const { data: allUsers } = await supabase
      .from("artists")
      .select("id, name, type, role, status, created_at, moderator_votes, disabled")
      .neq("role", "adm")
      .order("created_at", { ascending: false });

    const { data: moderators } = await supabase
      .from("artists")
      .select("id, name, type, role, status, created_at, moderator_votes")
      .in("role", ["adm", "moderador"])
      .order("created_at", { ascending: false });

    if (loadingEl) loadingEl.style.display = "none";

    if (!main) return;

    let html = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">← Voltar</button>
          <button class="perfil-nav-item active" data-section="pending">Pendentes (${pending?.length || 0})</button>
          <button class="perfil-nav-item" data-section="all">Todos usuários</button>
          <button class="perfil-nav-item" data-section="moderadores">Moderadores</button>
        </aside>
        <div class="perfil-content" id="perfil-content"></div>
      </div>
    `;
    main.innerHTML = html;

    const navItems = main.querySelectorAll(".perfil-nav-item");
    const content = document.getElementById("perfil-content");

    navItems.forEach(btn => {
      btn.addEventListener("click", () => {
        navItems.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const section = btn.dataset.section;
        if (section === "pending") renderPending(pending || []);
        if (section === "all") renderAll(allUsers || []);
        if (section === "moderadores") renderModeradores(moderators || []);
      });
    });

    renderPending(pending || []);

    function renderPending(list) {
      if (!content) return;
      if (!list.length) {
        content.innerHTML = "<p>Nenhum cadastro pendente.</p>";
        return;
      }
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Cadastros pendentes</h2>
          <p class="muted">Aprove ou recuse contas novas. Você também pode definir o tipo do usuário.</p>
          <div class="perfil-works">
            ${list.map(u => `
              <article class="perfil-work">
                <div>
                  <strong>${u.name}</strong>
                  <small>${new Date(u.created_at).toLocaleDateString()}</small>
                  <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                    <select class="approve-type" data-id="${u.id}" style="padding:8px; border:1px solid var(--line); border-radius:6px;">
                      <option value="student" ${u.type === 'student' ? 'selected' : ''}>Aluno Artista</option>
                      <option value="advisor" ${u.type === 'advisor' ? 'selected' : ''}>Orientador</option>
                    </select>
                    <button class="btn btn-sm btn-dark approve-btn" data-id="${u.id}">Aprovar</button>
                    <button class="btn btn-sm btn-outline reject-btn" data-id="${u.id}">Recusar</button>
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `;

      content.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const card = btn.closest(".perfil-work");
          const typeSelect = card.querySelector(".approve-type");
          const type = typeSelect ? typeSelect.value : "student";
          const role = type === "advisor" ? "orientador" : "artista";

          const { error } = await supabase
            .from("artists")
            .update({ status: "approved", type, role, approved_by: me.id, approved_at: new Date().toISOString() })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            btn.disabled = true;
            btn.textContent = "Aprovado";
            setTimeout(() => location.reload(), 600);
          }
        });
      });

      content.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const { error } = await supabase
            .from("artists")
            .update({ status: "rejected" })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            btn.disabled = true;
            btn.textContent = "Recusado";
            setTimeout(() => location.reload(), 600);
          }
        });
      });
    }

    function renderAll(list) {
      if (!content) return;
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Todos os usuários</h2>
          <p class="muted">Gerencie todos os usuários do sistema. Você pode aprovar, recusar, elevar a moderador ou desativar contas.</p>
          <div class="perfil-works">
            ${list.map(u => `
              <article class="perfil-work">
                <div>
                  <strong>${u.name}</strong>
                  <small>${u.type === 'advisor' ? 'Orientador' : 'Aluno'} · ${u.role || 'artista'} · ${u.status} ${u.disabled ? '· DESATIVADA' : ''}</small>
                  <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                    ${u.status === 'pending' ? `
                      <select class="approve-type" data-id="${u.id}" style="padding:8px; border:1px solid var(--line); border-radius:6px;">
                        <option value="student" ${u.type === 'student' ? 'selected' : ''}>Aluno</option>
                        <option value="advisor" ${u.type === 'advisor' ? 'selected' : ''}>Orientador</option>
                      </select>
                      <button class="btn btn-sm btn-dark approve-btn" data-id="${u.id}">Aprovar</button>
                      <button class="btn btn-sm btn-outline reject-btn" data-id="${u.id}">Recusar</button>
                    ` : ''}
                    ${u.status === 'approved' && u.role !== 'moderador' && u.role !== 'adm' ? `
                      <button class="btn btn-sm btn-dark promote-btn" data-id="${u.id}">Elevar a moderador</button>
                    ` : ''}
                    ${!u.disabled ? `
                      <button class="btn btn-sm btn-outline disable-btn" data-id="${u.id}">Desativar conta</button>
                    ` : `
                      <button class="btn btn-sm btn-dark enable-btn" data-id="${u.id}">Reativar conta</button>
                    `}
                  </div>
                </div>
              </article>
            `).join("")}
          </div>
        </div>
      `;

      content.querySelectorAll(".approve-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const card = btn.closest(".perfil-work");
          const typeSelect = card.querySelector(".approve-type");
          const type = typeSelect ? typeSelect.value : "student";
          const role = type === "advisor" ? "orientador" : "artista";

          const { error } = await supabase
            .from("artists")
            .update({ status: "approved", type, role, approved_by: me.id, approved_at: new Date().toISOString() })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            btn.disabled = true;
            btn.textContent = "Aprovado";
            setTimeout(() => location.reload(), 600);
          }
        });
      });

      content.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const { error } = await supabase
            .from("artists")
            .update({ status: "rejected" })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            btn.disabled = true;
            btn.textContent = "Recusado";
            setTimeout(() => location.reload(), 600);
          }
        });
      });

      content.querySelectorAll(".promote-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const { error } = await supabase
            .from("artists")
            .update({ role: "moderador" })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Usuário elevado a moderador!");
            setTimeout(() => location.reload(), 600);
          }
        });
      });

      content.querySelectorAll(".disable-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const reason = prompt("Motivo da desativação (opcional):") || "";
          const { error } = await supabase
            .from("artists")
            .update({ disabled: true, disabled_reason: reason || null })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Conta desativada.");
            setTimeout(() => location.reload(), 600);
          }
        });
      });

      content.querySelectorAll(".enable-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const { error } = await supabase
            .from("artists")
            .update({ disabled: false, disabled_reason: null })
            .eq("id", id);
          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Conta reativada.");
            setTimeout(() => location.reload(), 600);
          }
        });
      });
    }

    function renderModeradores(list) {
      if (!content) return;
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Moderadores</h2>
          <p class="muted">Lista de administradores e moderadores do sistema.</p>
          <div class="perfil-works">
            ${list.map(u => `
              <article class="perfil-work">
                <div>
                  <strong>${u.name}</strong>
                  <small>${u.type === 'advisor' ? 'Orientador' : 'Aluno'} · ${u.role} · ${u.status}</small>
                  <small>Votos: ${u.moderator_votes || 0}</small>
                </div>
              </article>
            `).join("") || "<p>Nenhum moderador.</p>"}
          </div>
        </div>
      `;
    }
  } catch (err) {
    console.error("[moderacao] error:", err);
    if (main) {
      main.innerHTML = '<p class="auth-error">Erro ao carregar moderação: ' + err.message + '</p>';
    }
  }
})();
