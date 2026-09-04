const state={arts:[],artists:[],currentArtistIndex:-1, user:null};

// ============================================
// Carregamento de dados: Supabase → fallback JSON
// ============================================

async function loadData(){
  try{
    // Tentar buscar do Supabase primeiro
    const loaded = await loadFromSupabase();
    if (!loaded) {
      // Fallback: carregar de JSONs estáticos
      await loadFromJSON();
    }
    renderArts(state.arts);
    renderArtists(state.artists);
    initHeroCarousel(state.arts);
  }catch(e){
    console.error("Erro ao carregar dados:", e);
    // Último recurso: tentar JSON
    try {
      await loadFromJSON();
      renderArts(state.arts);
      renderArtists(state.artists);
      initHeroCarousel(state.arts);
    } catch(e2) {
      console.error("Abra o projeto por um servidor local (ex.: Live Server).", e2);
    }
  }
}

async function loadFromSupabase() {
  try {
    const client = window.supabaseClient;
    if (!client) return false;

    // Buscar obras publicadas
    const { data: works, error: worksErr } = await client
      .from("works")
      .select("id, title, category, year, description, file_url, file_type, status, artist_id")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (worksErr || !works || works.length === 0) return false;

    // Buscar artistas
    const { data: artists, error: artistsErr } = await client
      .from("artists")
      .select("id, name, type, course, title, area, image, bio, curriculum, social, subjects")
      .order("created_at", { ascending: false });

    if (artistsErr || !artists || artists.length === 0) return false;

    // Mapear dados do Supabase para o formato esperado pelo frontend
    state.arts = works.map(w => ({
      id: w.id,
      title: w.title,
      category: w.category,
      year: w.year,
      description: w.description || "",
      image: w.file_url || "",
      artistId: w.artist_id,
      status: w.status
    }));

    state.artists = artists.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      course: a.course || "",
      title: a.title || "",
      area: a.area || "",
      image: a.image || "",
      bio: a.bio || "",
      curriculum: a.curriculum || "",
      social: a.social || {},
      subjects: a.subjects || [],
      works: state.arts.filter(w => w.artistId === a.id).map(w => w.id),
      academicProductions: []
    }));

    console.log(`✅ Dados carregados do Supabase: ${state.arts.length} obras, ${state.artists.length} artistas`);
    return true;
  } catch (e) {
    console.warn("Supabase não disponível, usando JSON:", e.message);
    return false;
  }
}

async function loadFromJSON() {
  const w = await fetch("data/works.json");
  state.arts = await w.json();
  const a = await fetch("data/artists.json");
  state.artists = await a.json();
  console.log(`📄 Dados carregados de JSON: ${state.arts.length} obras, ${state.artists.length} artistas`);
}

// ============================================
// Renderização
// ============================================

function getArtist(id){
  return state.artists.find(a=>a.id===id);
}

function renderArts(items){
  const grid = document.querySelector("#art-grid");
  if (!grid) return;

  // Filtrar: só obras publicadas (para JSON que não tem campo status)
  const published = items.filter(x => !x.status || x.status === "published");

  grid.innerHTML=published.map((x,i)=>{
    const artist=getArtist(x.artistId);
    const artistName=artist?artist.name:"Desconhecido";
    return `
    <article class="work" data-category="${x.category}">
      <div class="visual"><img src="${x.image}" alt="${x.title}" loading="lazy"></div>
      <div class="work-info"><div><div class="work-title">${x.title}</div><small>${artistName} · ${x.year}</small></div><div class="work-meta">${x.category}<br>${x.description?x.description.slice(0,40)+"...":""}</div></div>
    </article>`;
  }).join("");
}

function renderArtists(items){
  const advisors=items.filter(a=>a.type==="advisor");
  const students=items.filter(a=>a.type==="student");

  let html="";

  html+=`<div class="artist-group"><p class="eyebrow">ORIENTADORES</p>`;
  advisors.forEach((x,i)=>{
    html+=`
    <a class="artist" href="#" data-id="${x.id}">
     <span class="artist-num">${String(i+1).padStart(2,"0")}</span>
     <span class="artist-name">${x.name}</span>
     <span class="artist-course">${x.title||x.area||""}</span>
     <span class="artist-link">Ver perfil ↗</span>
    </a>`;
  });
  html+=`</div>`;

  html+=`<div class="artist-group"><p class="eyebrow">ALUNOS ARTISTAS</p>`;
  students.forEach((x,i)=>{
    html+=`
    <a class="artist" href="#" data-id="${x.id}">
     <span class="artist-num">${String(advisors.length+i+1).padStart(2,"0")}</span>
     <span class="artist-name">${x.name}</span>
     <span class="artist-course">${x.course||""}</span>
     <span class="artist-link">Ver perfil ↗</span>
    </a>`;
  });
  html+=`</div>`;

  document.querySelector("#artist-list").innerHTML=html;
}

function showArtistProfile(artist, index){
  state.currentArtistIndex = index;
  const profile=document.querySelector("#artist-profile");
  document.getElementById("profile-img").src=artist.image;
  document.getElementById("profile-img").alt=artist.name;
  document.getElementById("profile-name").textContent=artist.name;

  const courseEl=document.getElementById("profile-course");
  if(artist.type==="advisor"){
    courseEl.textContent=[artist.title, artist.area].filter(Boolean).join(" · ");
  }else{
    courseEl.textContent=artist.course||"";
  }

  document.getElementById("profile-bio").textContent=artist.bio||"";

  const worksGrid=document.getElementById("profile-works-grid");
  const artistWorks=state.arts.filter(a=>artist.works && artist.works.includes(a.id));
  if(artistWorks.length){
    worksGrid.innerHTML=artistWorks.map(w=>`
      <article class="work profile-work">
        <div class="visual"><img src="${w.image}" alt="${w.title}" loading="lazy"></div>
        <div class="work-info"><div><div class="work-title">${w.title}</div><small>${w.year} · ${w.category}</small></div><div class="work-meta">${w.description?w.description.slice(0,60)+"...":""}</div></div>
      </article>`).join("");
  }else{
    worksGrid.innerHTML="<p style='color:var(--muted);font-size:14px;'>Nenhuma obra cadastrada ainda.</p>";
  }

  let extraHtml="";

  if(artist.type==="advisor"){
    if(artist.curriculum){
      extraHtml+=`<div class="profile-section"><p class="eyebrow">CURRÍCULO</p><p class="profile-text">${artist.curriculum}</p></div>`;
    }
    if(artist.social){
      const links=[];
      if(artist.social.lattes) links.push(`<a class="social-link" href="${artist.social.lattes}" target="_blank" rel="noopener">Lattes ↗</a>`);
      if(artist.social.linkedin) links.push(`<a class="social-link" href="${artist.social.linkedin}" target="_blank" rel="noopener">LinkedIn ↗</a>`);
      if(artist.social.instagram) links.push(`<a class="social-link" href="${artist.social.instagram}" target="_blank" rel="noopener">Instagram ↗</a>`);
      if(artist.social.facebook) links.push(`<a class="social-link" href="${artist.social.facebook}" target="_blank" rel="noopener">Facebook ↗</a>`);
      if(artist.social.youtube) links.push(`<a class="social-link" href="${artist.social.youtube}" target="_blank" rel="noopener">YouTube ↗</a>`);
      if(artist.social.tiktok) links.push(`<a class="social-link" href="${artist.social.tiktok}" target="_blank" rel="noopener">TikTok ↗</a>`);
      if(artist.social.x) links.push(`<a class="social-link" href="${artist.social.x}" target="_blank" rel="noopener">X ↗</a>`);
      if(links.length){
        extraHtml+=`<div class="profile-section"><p class="eyebrow">REDES SOCIAIS</p><div class="social-links">${links.join("")}</div></div>`;
      }
    }
    if(artist.academicProductions && artist.academicProductions.length){
      extraHtml+=`<div class="profile-section"><p class="eyebrow">PRODUÇÕES ACADÊMICAS</p><ul class="production-list">${artist.academicProductions.map(p=>`<li><b>${p.type}</b>: ${p.title} (${p.year})${p.publisher?" — "+p.publisher:""}${p.journal?" — "+p.journal:""}</li>`).join("")}</ul></div>`;
    }
    if(artist.works && artist.works.length && typeof artist.works[0] === 'object'){
      extraHtml+=`<div class="profile-section"><p class="eyebrow">OBRAS E LINKS</p><ul class="production-list">${artist.works.map(w=>`<li><a href="${w.url}" target="_blank" rel="noopener">${w.title}</a> <small>(${w.type})</small></li>`).join("")}</ul></div>`;
    }
    if(artist.students && artist.students.length){
      const studentNames=artist.students.map(sid=>{const s=getArtist(sid);return s?s.name:"";}).filter(Boolean).join(", ");
      if(studentNames) extraHtml+=`<div class="profile-section"><p class="eyebrow">ALUNOS ORIENTADOS</p><p class="profile-text">${studentNames}</p></div>`;
    }
  }

  const advisorInfo=document.getElementById("profile-advisor");
  if(artist.type==="student" && artist.advisorId){
    const advisor=getArtist(artist.advisorId);
    if(advisor){
      extraHtml+=`<div class="profile-section"><p class="eyebrow">ORIENTADOR</p><p class="profile-text">${advisor.name} — ${advisor.title||advisor.area||""}</p></div>`;
    }
  }

  document.getElementById("profile-extra").innerHTML=extraHtml;

  profile.classList.add("show");
  document.body.style.overflow="hidden";
}

function prevArtist(){
  if(state.currentArtistIndex > 0){
    showArtistProfile(state.artists[state.currentArtistIndex - 1], state.currentArtistIndex - 1);
  }else if(state.artists.length){
    showArtistProfile(state.artists[state.artists.length - 1], state.artists.length - 1);
  }
}

function nextArtist(){
  if(state.currentArtistIndex < state.artists.length - 1){
    showArtistProfile(state.artists[state.currentArtistIndex + 1], state.currentArtistIndex + 1);
  }else if(state.artists.length){
    showArtistProfile(state.artists[0], 0);
  }
}

// ============================================
// Eventos
// ============================================

document.addEventListener("click",e=>{
  const f=e.target.closest(".filter");
  if(f){
   document.querySelectorAll(".filter").forEach(b=>b.classList.remove("active"));f.classList.add("active");
   const v=f.dataset.filter;
   renderArts(v==="all"?state.arts:state.arts.filter(x=>x.category===v));
  }

  const work=e.target.closest(".work");
  if(work && !work.classList.contains("profile-work")){
    const title=work.querySelector(".work-title").textContent.trim();
    const art=state.arts.find(a=>a.title===title);
    if(art){
      const box=document.querySelector("#surprise-result");
      const artist=getArtist(art.artistId);
      box.innerHTML=`<img src="${art.image}" alt="${art.title}" loading="lazy"><div class="work-info"><div><div class="work-title">${art.title}</div><small>${artist?artist.name:""}</small></div><div class="work-meta">${art.category}</div></div>`;
      box.classList.remove("show");void box.offsetWidth;box.classList.add("show");
      box.scrollIntoView({behavior:"smooth",block:"center"});
    }
  }

  const artist=e.target.closest(".artist");
  if(artist){
    e.preventDefault();
    const id=artist.dataset.id;
    const idx=state.artists.findIndex(a=>a.id===id);
    if(idx>=0) showArtistProfile(state.artists[idx], idx);
  }
});

document.querySelector("#surprise").addEventListener("click",()=>{
  if(!state.arts.length)return;
  const x=state.arts[Math.floor(Math.random()*state.arts.length)];
  const box=document.querySelector("#surprise-result");
  const artist=getArtist(x.artistId);
  box.innerHTML=`<img src="${x.image}" alt="${x.title}" loading="lazy"><div class="work-info"><div><div class="work-title">${x.title}</div><small>${artist?artist.name:""}</small></div><div class="work-meta">${x.category}</div></div>`;
  box.classList.remove("show");void box.offsetWidth;box.classList.add("show");
  box.scrollIntoView({behavior:"smooth",block:"center"});
});

document.getElementById("profile-prev").addEventListener("click", prevArtist);
document.getElementById("profile-next").addEventListener("click", nextArtist);

document.getElementById("profile-close").addEventListener("click",closeProfile);
document.addEventListener("keydown",e=>{
  if(e.key==="Escape")closeProfile();
  const profile=document.querySelector("#artist-profile");
  if(!profile.classList.contains("show")) return;
  if(e.key==="ArrowLeft") prevArtist();
  if(e.key==="ArrowRight") nextArtist();
});

function closeProfile(){
  const profile=document.querySelector("#artist-profile");
  profile.classList.remove("show");
  document.body.style.overflow="";
}

// ============================================
// Hero Carousel
// ============================================

let heroIndex=0;
let heroItems=[];

function initHeroCarousel(items){
  heroItems=items.slice(0,3);
  if(!heroItems.length)return;
  const container=document.querySelector("#hero-carousel");
  container.innerHTML=heroItems.map((x,i)=>`
    <div class="fan-card ${i===0?"active":i===1?"next":"hidden-right"}" data-index="${i}">
      <img src="${x.image}" alt="${x.title}" loading="lazy">
      <div class="fan-caption"><span>${String(i+1).padStart(2,"0")} / ${String(heroItems.length).padStart(2,"0")}</span><b>${x.title}</b><small>${getArtist(x.artistId)?getArtist(x.artistId).name:""} · ${x.year}</small></div>
    </div>`).join("");

  container.querySelectorAll(".fan-card").forEach(card=>{
    card.addEventListener("click",()=>{
      const idx=parseInt(card.dataset.index);
      goToHeroSlide(idx);
    });
  });

  document.getElementById("fan-prev").addEventListener("click",()=>goToHeroSlide((heroIndex-1+heroItems.length)%heroItems.length));
  document.getElementById("fan-next").addEventListener("click",()=>goToHeroSlide((heroIndex+1)%heroItems.length));
}

function goToHeroSlide(idx){
  if(!heroItems.length)return;
  heroIndex=idx;
  const cards=document.querySelectorAll(".fan-card");
  cards.forEach((c,i)=>{
    c.className="fan-card";
    if(i===heroIndex) c.classList.add("active");
    else if(i===heroIndex-1 || (heroIndex===0 && i===heroItems.length-1)) c.classList.add("prev");
    else if(i===heroIndex+1 || (heroIndex===heroItems.length-1 && i===0)) c.classList.add("next");
    else if(i<heroIndex) c.classList.add("hidden-left");
    else c.classList.add("hidden-right");
  });
}

loadData();
