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
      .select("id, role, status")
      .eq("user_id", user.id)
      .single();

    if (!me || !["adm", "moderador", "orientador"].includes(me.role)) {
      if (main) main.innerHTML = "<p>Acesso restrito.</p>";
      return;
    }

    const { data: pending } = await supabase
      .from("artists")
      .select("id, name, type, role, status, created_at, moderator_votes")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const { data: artists } = await supabase
      .from("artists")
      .select("id, name, type, role, status, moderator_votes")
      .neq("role", "adm")
      .order("moderator_votes", { ascending: false });

    if (loadingEl) loadingEl.style.display = "none";

    if (!main) return;

    let html = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">? Voltar</button>
          <button class="perfil-nav-item active" data-section="pending">Pendentes (${pending?.length || 0})</button>
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
        if (section === "moderadores") renderModeradores(artists || []);
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
          <p class="muted">Aprove ou recuse contas novas. Apenas orientadores e admins podem aprovar.</p>
          <div class="perfil-works">
            ${list.map(u => `
              <article class="perfil-work">
                <div>
                  <strong>${u.name}</strong>
                  <small>${new Date(u.created_at).toLocaleDateString()}</small>
                  <div style="margin-top:10px; display:flex; gap:8px; align-items:center;">
                    <select class="approve-type" data-id="${u.id}" style="padding:8px; border:1px solid var(--line); border-radius:6px;">
                      <option value="student">Aluno Artista</option>
                      <option value="advisor">Orientador</option>
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

    function renderModeradores(list) {
      if (!content) return;
      const candidatos = list.filter(a => a.role === "artista" && a.status === "approved");
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Elevar a moderador</h2>
          <p class="muted">São necessários 3 votos de orientadores para elevar um artista a moderador.</p>
          <div class="perfil-works">
            ${candidatos.map(u => `
              <article class="perfil-work">
                <div>
                  <strong>${u.name}</strong>
                  <small>Votos: ${u.moderator_votes || 0}/3</small>
                  <div style="margin-top:10px;">
                    <button class="btn btn-sm btn-dark vote-btn" data-id="${u.id}">Votar para moderador</button>
                  </div>
                </div>
              </article>
            `).join("") || "<p>Nenhum candidato disponível.</p>"}
          </div>
        </div>
      `;

      content.querySelectorAll(".vote-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;
          const { data: existing } = await supabase
            .from("advisor_votes")
            .select("id")
            .eq("artist_id", id)
            .eq("advisor_id", me.id)
            .single();

          if (existing) {
            alert("Você já votou neste candidato.");
            return;
          }

          const voteId = "vote-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
          const { error: voteErr } = await supabase
            .from("advisor_votes")
            .insert({ id: voteId, artist_id: id, advisor_id: me.id });

          if (voteErr) {
            alert("Erro ao votar: " + voteErr.message);
            return;
          }

          const { data: current } = await supabase
            .from("artists")
            .select("moderator_votes")
            .eq("id", id)
            .single();

          const newVotes = (current?.moderator_votes || 0) + 1;
          const updates = { moderator_votes: newVotes };
          if (newVotes >= 3) {
            updates.role = "moderador";
          }

          const { error: updateErr } = await supabase
            .from("artists")
            .update(updates)
            .eq("id", id);

          if (updateErr) {
            alert("Erro ao atualizar: " + updateErr.message);
          } else {
            alert(newVotes >= 3 ? "Candidato elevado a moderador!" : "Voto registrado.");
            setTimeout(() => location.reload(), 600);
          }
        });
      });
    }
  } catch (err) {
    console.error("[moderacao] error:", err);
    if (main) {
      main.innerHTML = '<p class="auth-error">Erro ao carregar moderação: ' + err.message + '</p>';
    }
  }
})();
