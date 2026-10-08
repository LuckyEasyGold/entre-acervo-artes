const state={documents:[]};

function getTextType(work){
  const raw = String(work?.file_type || "").trim().toLowerCase();
  if (raw) return raw;
  const url = String(work?.file_url || work?.image || "").toLowerCase();
  if (/\.(pdf|doc|docx|txt|rtf|odt)$/i.test(url)) return url.split(".").pop();
  return "pdf";
}

function isTextDocumentWork(work){
  if (!work) return false;
  const status = String(work.status || "published").toLowerCase();
  if (status !== "published") return false;
  const type = getTextType(work);
  return ["pdf", "doc", "docx", "txt", "rtf", "odt", "document"].includes(type) || /\.(pdf|doc|docx|txt|rtf|odt)$/i.test(String(work.file_url || work.image || ""));
}

async function loadDocs(){
  try{
    const items = [];
    const supabase = window.supabaseClient;
    if (supabase) {
      const { data } = await supabase
        .from("works")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (Array.isArray(data)) {
        items.push(...data.filter(isTextDocumentWork));
      }
    }

    if (!items.length) {
      const r = await fetch("/data/documents.json");
      if(!r.ok) throw new Error("Falha ao carregar data/documents.json");
      const fallback = await r.json();
      items.push(...fallback.filter(item => {
        const status = String(item?.status || "published").toLowerCase();
        return status === "published" || !item?.status;
      }));
    }

    state.documents = items.filter(isTextDocumentWork);
    renderDocs(state.documents);
  }catch(e){
    console.error(e);
    const grid=document.querySelector("#docs-grid");
    if(grid) grid.innerHTML=`<p style="color:var(--muted);font-size:14px;">Erro ao carregar documentos: ${e.message}</p>`;
  }
}

function renderDocs(items){
  const grid=document.querySelector("#docs-grid");
  if(!grid) return;
  grid.innerHTML=items.map(x=>{
    const fileUrl = x.file_url || x.file || x.image || '#';
    const cover = x.image || x.cover || x.file || '';
    return `
      <article class="doc-card">
        <div class="doc-header">
          <span class="doc-id">${x.id || x.title}</span>
          <span class="doc-license">${x.license || getTextType(x).toUpperCase()}</span>
        </div>
        <div class="doc-cover">
          <img src="${cover}" alt="${x.title || 'Capa da publicação'}" loading="lazy">
        </div>
        <h3 class="doc-title">${x.title}</h3>
        <p class="doc-desc">${x.description || 'Publicação em texto.'}</p>
        <div class="doc-meta">
          <span><b>Autor:</b> ${x.owner || x.name || 'Autor'}</span>
          <span><b>Ano:</b> ${x.year || new Date().getFullYear()}</span>
        </div>
        <a class="doc-link" href="${fileUrl}" target="_blank" rel="noopener">Abrir ${getTextType(x).toUpperCase()} ↗</a>
      </article>`;
  }).join("");
}

document.addEventListener("click",e=>{
  const f=e.target.closest(".filter");
  if(f){
    document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));
    f.classList.add("active");
    const v=f.dataset.filter;
    if(v==="all") renderDocs(state.documents);
    else renderDocs(state.documents.filter(x=>x.license===v));
  }
});

if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",loadDocs)}
else{loadDocs()}
