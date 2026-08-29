const state={arts:[],artists:[],currentArtistIndex:-1};

async function loadData(){
  try{
    const r=await fetch("data/arts.json");
    state.arts=await r.json();
    const a=await fetch("data/artists.json");
    state.artists=await a.json();
    renderArts(state.arts);
    renderArtists(state.artists);
    initHeroCarousel(state.arts);
  }catch(e){console.error("Abra o projeto por um servidor local (ex.: Live Server).",e)}
}

function renderArts(items){
  document.querySelector("#art-grid").innerHTML=items.map((x,i)=>`
    <article class="work" data-category="${x.category}">
      <div class="visual"><img src="${x.image}" alt="${x.title}" loading="lazy"></div>
      <div class="work-info"><div><div class="work-title">${x.title}</div><small>${x.artist} · ${x.year}</small></div><div class="work-meta">${x.technique}<br>${x.theme}</div></div>
    </article>`).join("");
}

function renderArtists(items){
  document.querySelector("#artist-list").innerHTML=items.map((x,i)=>`
   <a class="artist" href="#">
    <span class="artist-num">${String(i+1).padStart(2,"0")}</span>
    <span class="artist-name">${x.name}</span>
    <span class="artist-course">${x.course}</span>
    <span class="artist-link">Ver perfil ↗</span>
   </a>`).join("");
}

function showArtistProfile(artist, index){
  state.currentArtistIndex = index;
  const profile=document.querySelector("#artist-profile");
  document.getElementById("profile-img").src=artist.image;
  document.getElementById("profile-img").alt=artist.name;
  document.getElementById("profile-name").textContent=artist.name;
  document.getElementById("profile-course").textContent=artist.course;
  document.getElementById("profile-bio").textContent=artist.bio;

  const worksGrid=document.getElementById("profile-works-grid");
  const artistWorks=state.arts.filter(a=>artist.works.includes(a.title));
  if(artistWorks.length){
    worksGrid.innerHTML=artistWorks.map(w=>`
      <article class="work profile-work">
        <div class="visual"><img src="${w.image}" alt="${w.title}" loading="lazy"></div>
        <div class="work-info"><div><div class="work-title">${w.title}</div><small>${w.artist} · ${w.year}</small></div><div class="work-meta">${w.technique}<br>${w.theme}</div></div>
      </article>`).join("");
  }else{
    worksGrid.innerHTML="<p style='color:var(--muted);font-size:14px;'>Nenhuma obra cadastrada ainda.</p>";
  }

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
      box.innerHTML=`<img src="${art.image}" alt="${art.title}" loading="lazy"><div class="work-info"><div><div class="work-title">${art.title}</div><small>${art.artist}</small></div><div class="work-meta">${art.technique}</div></div>`;
      box.classList.remove("show");void box.offsetWidth;box.classList.add("show");
      box.scrollIntoView({behavior:"smooth",block:"center"});
    }
  }

  const artist=e.target.closest(".artist");
  if(artist){
    e.preventDefault();
    const name=artist.querySelector(".artist-name").textContent.trim();
    const idx=state.artists.findIndex(a=>a.name===name);
    if(idx>=0) showArtistProfile(state.artists[idx], idx);
  }
});

document.querySelector("#surprise").addEventListener("click",()=>{
  if(!state.arts.length)return;
  const x=state.arts[Math.floor(Math.random()*state.arts.length)];
  const box=document.querySelector("#surprise-result");
  box.innerHTML=`<img src="${x.image}" alt="${x.title}" loading="lazy"><div class="work-info"><div><div class="work-title">${x.title}</div><small>${x.artist}</small></div><div class="work-meta">${x.technique}</div></div>`;
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

let heroIndex=0;
let heroItems=[];

function initHeroCarousel(items){
  heroItems=items.slice(0,3);
  if(!heroItems.length)return;
  const container=document.querySelector("#hero-carousel");
  container.innerHTML=heroItems.map((x,i)=>`
    <div class="fan-card ${i===0?"active":i===1?"next":"hidden-right"}" data-index="${i}">
      <img src="${x.image}" alt="${x.title}" loading="lazy">
      <div class="fan-caption"><span>${String(i+1).padStart(2,"0")} / ${String(heroItems.length).padStart(2,"0")}</span><b>${x.title}</b><small>${x.artist} · ${x.year}</small></div>
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
