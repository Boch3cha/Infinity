import { CATEGORIES, MOVIES } from "./data.js";

const $ = (sel) => document.querySelector(sel);

// ===== Drawer (menu) =====
function setupDrawer(){
  const drawer = $("#drawer");
  const backdrop = $("#backdrop");
  const openBtn = $("#openDrawer");
  const closeBtn = $("#closeDrawer");
  if(!drawer || !backdrop || !openBtn || !closeBtn) return;

  const open = () => {
    drawer.classList.add("open");
    backdrop.hidden = false;
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    drawer.classList.remove("open");
    backdrop.hidden = true;
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openBtn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") close(); });

  return { close };
}

const drawerApi = setupDrawer();

// ===== Render helpers =====
function cardHTML(m, rank){
  return `
    <article class="card" role="listitem" data-id="${m.id}">
      <div class="poster">
        ${rank ? `<div class="rank">${rank}</div>` : ``}
      </div>
      <div class="card-body">
        <p class="title">${m.title}</p>
        <div class="chips">
          ${m.genres.map(g=>`<span class="chip">${g}</span>`).join("")}
        </div>

        <button class="btn primary full" data-action="play">
  ▶ ASSISTIR
</button>

        <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
          <button class="btn primary" data-action="play"><span class="play"></span> PLAY</button>
          <button class="btn" data-action="details">DETALHES</button>
        </div>
      </div>
    </article>
  `;
}

function bindActions(container){
  if(!container) return;
  container.querySelectorAll("[data-action]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest("[data-id]").dataset.id;
      const action = btn.dataset.action;
      if(action === "details") location.href = `detalhes.html?id=${encodeURIComponent(id)}`;
      if(action === "play") location.href = `player.html?id=${encodeURIComponent(id)}`;
    });
  });
}

// ===== Hero =====
function renderHero(movie){
  const hero = $("#hero");
  if(!hero) return;

  hero.innerHTML = `
    <div class="hero-top">
      <div class="hero-content">
        <div class="hero-kicker">EM DESTAQUE</div>
        <h4 class="hero-title">${movie.title}</h4>
        <div class="hero-actions">
          <button class="btn primary" data-action="play"><span class="play"></span> PLAY</button>
          <button class="btn" data-action="details">DETALHES</button>
        </div>
      </div>
    </div>
  `;

  hero.querySelectorAll("[data-action]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const action = btn.dataset.action;
      if(action === "details") location.href = `detalhes.html?id=${encodeURIComponent(movie.id)}`;
      if(action === "play") location.href = `player.html?id=${encodeURIComponent(movie.id)}`;
    });
  });
}

// ===== Lists =====
function renderTop(list){
  const top = $("#topList");
  if(!top) return;
  top.innerHTML = list.slice(0,10).map((m,i)=>cardHTML(m, i+1)).join("");
  bindActions(top);
}

function renderLatest(list){
  const latest = $("#latestList");
  if(!latest) return;
  latest.innerHTML = list.slice().reverse().map(m=>cardHTML(m)).join("");
  bindActions(latest);
}

// ===== Categories =====
function renderCategories(){
  const catRow = $("#catRow");
  const drawerCats = $("#drawerCats");
  if(catRow){
    catRow.innerHTML = CATEGORIES.map(c =>
      `<button class="cat cat-genre" data-cat="${c.id}"><span>${c.name}</span></button>`
    ).join("");
  }
  if(drawerCats){
    drawerCats.innerHTML = CATEGORIES.map(c =>
      `<button class="drawer-item" data-cat="${c.id}">${c.name}</button>`
    ).join("");
  }
}

function setTitleFromCategory(catId){
  const el = $("#pageTitle");
  if(!el) return;
  if(!catId) el.textContent = "Top 10 da Semana";
  else {
    const name = CATEGORIES.find(c=>c.id===catId)?.name ?? "Categoria";
    el.textContent = `Top 10 — ${name}`;
  }
}

function renderAll(catId){
  const filtered = catId ? MOVIES.filter(m => m.category === catId) : MOVIES;

  // Hero: primeiro do filtro, se vazio pega o primeiro do catálogo
  renderHero(filtered[0] ?? MOVIES[0]);
  renderContinueWatching();
  setTitleFromCategory(catId);
  renderTop(filtered);
  renderLatest(filtered);
}

// Eventos de clique nas categorias
function setupCategoryClicks(){
  const catRow = $("#catRow");
  const drawerCats = $("#drawerCats");

  const pick = (catId) => {
    renderAll(catId);
    drawerApi?.close?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  catRow?.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-cat]");
    if(!el) return;
    pick(el.dataset.cat);
  });

  drawerCats?.addEventListener("click", (e)=>{
    const el = e.target.closest("[data-cat]");
    if(!el) return;
    pick(el.dataset.cat);
  });
}
function getProgress(){
  return JSON.parse(localStorage.getItem("infinity_progress_v1") || "{}");
}

function progressCardHTML(p){
  const pct = (p.dur && p.dur > 0) ? Math.min(100, Math.round((p.t / p.dur) * 100)) : 0;

  return `
    <article class="card" role="listitem" data-id="${p.id}">
      <div class="poster" style="height:140px;">
        <div style="position:absolute; left:12px; right:12px; bottom:12px;">
          <div style="height:6px; border-radius:999px; background:rgba(255,255,255,.18); overflow:hidden;">
            <div style="height:100%; width:${pct}%; background:rgba(255,255,255,.85);"></div>
          </div>
        </div>
      </div>
      <div class="card-body">
        <p class="title">${p.title || "Sem título"}</p>
        <div class="watchbar" data-action="resume"><span class="play"></span> CONTINUAR</div>
      </div>
    </article>
  `;
}

function renderContinueWatching(){
  const wrap = document.getElementById("continueList");
  const header = document.getElementById("cwHeader");
  const clearBtn = document.getElementById("cwClear");
  if(!wrap || !header) return;

  const data = getProgress();
  const items = Object.entries(data)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a,b)=> (b.updatedAt||0) - (a.updatedAt||0))
    .slice(0, 10);

  if(items.length === 0){
    header.style.display = "none";
    wrap.innerHTML = "";
    return;
  }

  header.style.display = "flex";
  wrap.innerHTML = items.map(progressCardHTML).join("");

  wrap.querySelectorAll('[data-action="resume"]').forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.closest("[data-id]").dataset.id;
      location.href = `player.html?id=${encodeURIComponent(id)}`;
    });
  });

  clearBtn?.addEventListener("click", ()=>{
    localStorage.removeItem("infinity_progress_v1");
    renderContinueWatching();
  });
}
// ===== Boot =====
renderCategories();
setupCategoryClicks();
renderAll(null);
