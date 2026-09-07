// ============================================
// ENTRE — Orientação (aluno)
// ============================================

(async function() {
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

    const { data: me } = await supabase
      .from("artists")
      .select("id, role, type, advisor_id")
      .eq("user_id", user.id)
      .single();

    if (!me || me.type !== "student") {
      main.innerHTML = "<p>Acesso restrito a alunos.</p>";
      return;
    }

    const { data: disciplines } = await supabase
      .from("disciplines")
      .select("*, advisor:artists(id, name, title)")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    const { data: myEnrollments } = await supabase
      .from("enrollments")
      .select("*")
      .eq("artist_id", me.id);

    const { data: advisorReqs } = await supabase
      .from("advisor_requests")
      .select("*")
      .eq("artist_id", me.id);

    main.innerHTML = `
      <div class="perfil-layout">
        <aside class="perfil-sidebar">
          <button class="btn-back" onclick="window.history.back()">← Voltar</button>
          <button class="perfil-nav-item active" data-section="disciplines">Disciplinas</button>
          <button class="perfil-nav-item" data-section="advisor">Solicitar orientação</button>
          <button class="perfil-nav-item" data-section="status">Meus pedidos</button>
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
        if (section === "disciplines") renderDisciplines();
        if (section === "advisor") renderAdvisorRequest();
        if (section === "status") renderStatus();
      });
    });

    function renderDisciplines() {
      if (!content) return;
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Disciplinas disponíveis</h2>
          <p class="muted">Inscreva-se nas disciplinas oferecidas pelos orientadores.</p>
          <div class="perfil-works">
            ${disciplines?.map(d => {
              const enrolled = myEnrollments?.some(e => e.discipline_id === d.id);
              return `
                <article class="perfil-work">
                  <div>
                    <strong>${d.name}</strong>
                    <small>${d.advisor?.name || ''} · ${d.advisor?.title || ''}</small>
                    <p>${d.description || ''}</p>
                    ${enrolled
                      ? `<button class="btn btn-sm btn-outline" disabled>Inscrito</button>`
                      : `<button class="btn btn-sm btn-dark enroll-btn" data-id="${d.id}">Inscrever-se</button>`
                    }
                  </div>
                </article>
              `;
            }).join("") || "<p>Nenhuma disciplina disponível no momento.</p>"}
          </div>
        </div>
      `;

      content.querySelectorAll(".enroll-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
          const discId = btn.dataset.id;
          const id = "enr-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
          const message = prompt("Mensagem para o orientador (opcional):", "") || "";

          const { error } = await supabase.from("enrollments").insert({
            id,
            discipline_id: discId,
            artist_id: me.id,
            message,
            status: "pending"
          });

          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Inscrição enviada!");
            window.location.reload();
          }
        });
      });
    }

    function renderAdvisorRequest() {
      if (!content) return;
      const pending = advisorReqs?.some(r => r.status === "pending");
      content.innerHTML = `
        <div class="perfil-section">
          <h2>Solicitar orientação</h2>
          <p class="muted">Escolha um orientador para solicitar orientação.</p>
          <form id="advisor-form" class="perfil-form">
            <label><span>Orientador</span>
              <select id="advisor-id" required>
                <option value="">Selecione...</option>
                ${disciplines?.map(d => `<option value="${d.advisor?.id}">${d.advisor?.name} — ${d.advisor?.title || ''}</option>`).join("") || ""}
              </select>
            </label>
            <label><span>Mensagem</span><textarea id="advisor-message" rows="3" placeholder="Conte um pouco sobre seu trabalho e expectativas..."></textarea></label>
            <button type="submit" class="btn btn-dark" ${pending ? 'disabled' : ''}>Enviar solicitação</button>
            ${pending ? '<p class="muted">Você já tem uma solicitação pendente.</p>' : ''}
          </form>
        </div>
      `;

      const form = document.getElementById("advisor-form");
      if (form && !pending) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          const advisorId = document.getElementById("advisor-id").value;
          const message = document.getElementById("advisor-message").value.trim();
          if (!advisorId) return;

          const id = "ar-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
          const { error } = await supabase.from("advisor_requests").insert({
            id,
            artist_id: me.id,
            advisor_id,
            message,
            status: "pending"
          });

          if (error) {
            alert("Erro: " + error.message);
          } else {
            alert("Solicitação enviada!");
            window.location.reload();
          }
        });
      }
    }

    function renderStatus() {
      if (!content) return;
      const pendingReq = advisorReqs?.find(r => r.status === "pending");
      const pendingEnr = myEnrollments?.filter(e => e.status === "pending");
      const approvedEnr = myEnrollments?.filter(e => e.status === "approved");

      content.innerHTML = `
        <div class="perfil-section">
          <h2>Meus pedidos</h2>
          <div class="perfil-works">
            ${pendingReq ? `
              <article class="perfil-work">
                <div>
                  <strong>Orientação</strong>
                  <small>Status: ${pendingReq.status}</small>
                  <p>${pendingReq.message || ''}</p>
                </div>
              </article>
            ` : ''}
            ${pendingEnr?.map(e => `
              <article class="perfil-work">
                <div>
                  <strong>Inscrição em disciplina</strong>
                  <small>Status: ${e.status}</small>
                  <p>${e.message || ''}</p>
                </div>
              </article>
            `).join("") || ''}
            ${approvedEnr?.map(e => `
              <article class="perfil-work">
                <div>
                  <strong>Inscrição aprovada</strong>
                  <small>${e.discipline_id}</small>
                </div>
              </article>
            `).join("") || ''}
            ${!pendingReq && !pendingEnr?.length && !approvedEnr?.length ? '<p>Nenhum pedido realizado.</p>' : ''}
          </div>
        </div>
      `;
    }

    renderDisciplines();
  } catch (err) {
    console.error("[orientacao] error:", err);
    if (main) {
      main.innerHTML = '<p class="auth-error">Erro ao carregar orientação: ' + err.message + '</p>';
    }
  }
})();
