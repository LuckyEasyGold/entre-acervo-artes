// ============================================
// ENTRE — Dashboard Logic
// ============================================

import { getCurrentUser, signOut } from "./supabase.js";

const dashLinks = document.querySelectorAll(".dash-link");
const sections = document.querySelectorAll(".dash-section");
const logoutLink = document.getElementById("logout-link");

function showSection(id) {
  sections.forEach(s => s.style.display = "none");
  const target = document.getElementById("section-" + id);
  if (target) target.style.display = "block";
  dashLinks.forEach(l => l.classList.remove("active"));
  const active = document.querySelector(`.dash-link[data-section="${id}"]`);
  if (active) active.classList.add("active");
}

dashLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

if (logoutLink) {
  logoutLink.addEventListener("click", async (e) => {
    e.preventDefault();
    await signOut();
    window.location.href = "index.html";
  });
}

(async () => {
  const { user, error } = await getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Carregar perfil do usuário
  const supabase = await (await import("./supabase.js")).getSupabase();
  if (!supabase) return;

  const { data: artist } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (artist) {
    const nameEl = document.getElementById("profile-name");
    const bioEl = document.getElementById("profile-bio");
    if (nameEl) nameEl.value = artist.name || "";
    if (bioEl) bioEl.value = artist.bio || "";
  }

  // Salvar perfil
  const profileForm = document.getElementById("profile-form");
  if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("profile-name").value.trim();
      const bio = document.getElementById("profile-bio").value.trim();
      const { error } = await supabase
        .from("artists")
        .upsert({ user_id: user.id, name, bio, updated_at: new Date() });
      if (error) {
        alert("Erro ao salvar perfil: " + error.message);
      } else {
        alert("Perfil salvo!");
      }
    });
  }

  // Carregar obras do usuário
  const worksList = document.getElementById("my-works-list");
  if (worksList && artist) {
    const { data: works } = await supabase
      .from("works")
      .select("*")
      .eq("artist_id", artist.id)
      .order("created_at", { ascending: false });
    if (works && works.length) {
      worksList.innerHTML = works.map(w => `
        <div class="work-item">
          <strong>${w.title}</strong>
          <small>${w.category} · ${w.status}</small>
        </div>
      `).join("");
    } else {
      worksList.innerHTML = "<p>Nenhuma obra cadastrada ainda.</p>";
    }
  }

  // Salvar nova obra
  const workForm = document.getElementById("work-form");
  if (workForm && artist) {
    workForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = document.getElementById("work-title").value.trim();
      const category = document.getElementById("work-category").value;
      const year = parseInt(document.getElementById("work-year").value) || new Date().getFullYear();
      const description = document.getElementById("work-description").value.trim();
      const status = document.getElementById("work-status").value;
      const fileInput = document.getElementById("work-file");

      let file_url = null;
      let file_type = null;

      if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const ext = file.name.split(".").pop().toLowerCase();
        if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) file_type = "image";
        else if (["mp4", "mov", "avi", "webm"].includes(ext)) file_type = "video";
        else if (ext === "pdf") file_type = "pdf";
        else {
          alert("Tipo de arquivo não suportado.");
          return;
        }

        const filePath = `works/${artist.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("works")
          .upload(filePath, file);
        if (uploadError) {
          alert("Erro no upload: " + uploadError.message);
          return;
        }
        const { data: { publicUrl } } = supabase.storage
          .from("works")
          .getPublicUrl(filePath);
        file_url = publicUrl;
      }

      const { error } = await supabase
        .from("works")
        .insert({
          artist_id: artist.id,
          title,
          category,
          year,
          description,
          file_url,
          file_type,
          status
        });

      if (error) {
        alert("Erro ao salvar obra: " + error.message);
      } else {
        alert("Obra salva!");
        workForm.reset();
        showSection("works");
        // Recarregar lista
        const { data: works } = await supabase
          .from("works")
          .select("*")
          .eq("artist_id", artist.id)
          .order("created_at", { ascending: false });
        if (works && works.length) {
          worksList.innerHTML = works.map(w => `
            <div class="work-item">
              <strong>${w.title}</strong>
              <small>${w.category} · ${w.status}</small>
            </div>
          `).join("");
        }
      }
    });
  }
})();
