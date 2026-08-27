const state={documents:[]};

async function loadDocs(){
  try{
    const r=await fetch("/data/documents.json");
    if(!r.ok) throw new Error("Falha ao carregar data/documents.json");
    state.documents=await r.json();
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
  grid.innerHTML=items.map(x=>`
    <article class="doc-card">
      <div class="doc-header">
        <span class="doc-id">${x.id}</span>
        <span class="doc-license">${x.license}</span>
      </div>
      <h3 class="doc-title">${x.title}</h3>
      <p class="doc-desc">${x.description}</p>
      <div class="doc-meta">
        <span><b>Autor:</b> ${x.owner}</span>
        <span><b>Ano:</b> ${x.year}</span>
      </div>
      <a class="doc-link" href="${x.file}" target="_blank" rel="noopener">Abrir PDF ↗</a>
    </article>`).join("");
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
