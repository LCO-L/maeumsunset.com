// app.js — daily question, 3 campfires, likes (frontend demo, offline-ready)

let CFG = null;
let state = { fireScore: 0, level: 0, streak: 0, longCount: 0, installed: false, uid: null };

let PROBE = { bank: {followups:["조금 더 풀어줄 수 있을까요?","그 순간의 소리/냄새/빛은 어땠나요?","한 문장으로 더 요약하면?"]} };

const $ = (sel)=> document.querySelector(sel);
const todayKey = ()=> new Date().toISOString().slice(0,10);
const seedRand = (seed)=>{ let h=0; for(let i=0;i<seed.length;i++) h=(h*31 + seed.charCodeAt(i))|0; return ()=>{ h = (1103515245*h + 12345) & 0x7fffffff; return (h/0x7fffffff); }; };

// Safe storage
const MemoryStore = { _m:{}, set(k,v){ this._m[k]=v; }, get(k){ return this._m[k]; } };
function safeSetItem(k, v){ try { localStorage.setItem(k, v); } catch(e){ MemoryStore.set(k,v);} }
function safeGetItem(k){ try { return localStorage.getItem(k); } catch(e){ return MemoryStore.get(k) || null; } }

// UI refs
let questionCard, journal, lenBar, lengthHint, toast;
let campTitle, campGrid, exploreGrid;
let levelHint, scoreHint, streakBadge, campfireGate;
let canvas; // for potential fire bg later

// Fire scoring (kept simple)
function addScore(n){ state.fireScore = Math.max(0, Math.round((state.fireScore + n)*10)/10); saveState(); updateHUD(); }
function addLogUnits(n){ state.longCount = (state.longCount || 0) + n; saveState(); updateHUD(); }
function saveState(){ safeSetItem('sunset_state', JSON.stringify(state)); }
function loadState(){ const s = safeGetItem('sunset_state'); if(s){ try{ state = {...state, ...JSON.parse(s)}; }catch(_){} } if(!state.uid){ state.uid = crypto.randomUUID ? crypto.randomUUID() : (Date.now()+"-"+Math.random()); } }

function showToast(msg){ if(!toast) return; toast.textContent=msg; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1600); }

function updateHUD(){
  if(!levelHint || !scoreHint || !campfireGate || !streakBadge) return;
  levelHint.textContent = `L${state.level||0} · 불씨`;
  scoreHint.textContent = `score ${state.fireScore}`;
  campfireGate.textContent = `Campfire 입장권: 기록 ${state.longCount}/3`;
  streakBadge.textContent = `연속 ${state.streak||0}일`;
}

// ====== High-Quality Campfire Renderer (Canvas) ======
class Firepit



// === Daily key & topic store (3 topics per day) ===
function todayKey(){ return new Date().toISOString().slice(0,10); }

function loadCampTopics(){
  const k = 'camp_topics:'+todayKey();
  const raw = safeGetItem(k);
  if(raw) return JSON.parse(raw);
  const topics = [
    { id: 0, title: "오늘의 하이라이트" },
    { id: 1, title: "지금 나를 잡아끄는 감정" },
    { id: 2, title: "내가 선택할 작은 행동" }
  ];
  safeSetItem(k, JSON.stringify(topics));
  return topics;
}
function saveCampTopics(topics){
  safeSetItem('camp_topics:'+todayKey(), JSON.stringify(topics));
}
let CAMP_TOPICS = loadCampTopics();
let currentRoomIdx = null; // which camp is open now


 {
  constructor(canvas, opts={}){
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = canvas.width = canvas.clientWidth * (window.devicePixelRatio||1);
    this.h = canvas.height = canvas.clientHeight * (window.devicePixelRatio||1);
    this.scale = window.devicePixelRatio || 1;
    this.opts = Object.assign({
      intensity: 1.0,       // 0.5 ~ 2.0
      emberCount: 140,      // particles
      wind: 0.12,
      hueBase: 28           // fire hue ~ orange
    }, opts);
    this.t = 0;
    this.embers = [];
    for(let i=0;i<this.opts.emberCount;i++) this.spawn(true);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    window.addEventListener('resize', ()=>{
      this.w = canvas.width = canvas.clientWidth * (window.devicePixelRatio||1);
      this.h = canvas.height = canvas.clientHeight * (window.devicePixelRatio||1);
    });
  }
  rnd(){ return Math.random(); }
  spawn(initial=false){
    // spawn around base
    const baseW = this.w * 0.2;
    const x = this.w/2 + (this.rnd()-0.5)*baseW;
    const y = this.h*0.78 + (this.rnd()*6);
    const v = (0.6 + this.rnd()*0.7) * this.opts.intensity;
    const life = 900 + this.rnd()*1200;
    const size = 2 + this.rnd()*3;
    const hue = this.opts.hueBase + (this.rnd()*10);
    const alpha = .6 + this.rnd()*0.35;
    this.embers.push({x,y, vx:(this.rnd()-0.5)*0.15, vy:-v, life, age: initial? this.rnd()*life:0, size, hue, alpha});
  }
  drawFlameCore(){
    const g = this.ctx.createRadialGradient(this.w/2, this.h*0.72, this.h*0.02, this.w/2, this.h*0.62, this.h*0.22);
    g.addColorStop(0, `rgba(255,250,230,0.95)`);
    g.addColorStop(0.25, `rgba(255,210,140,0.92)`);
    g.addColorStop(0.55, `rgba(255,150,60,0.85)`);
    g.addColorStop(0.8, `rgba(255,110,40,0.55)`);
    g.addColorStop(1, `rgba(40,20,10,0)`);
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = g;
    this.ctx.beginPath();
    // bulb
    this.ctx.ellipse(this.w/2, this.h*0.66, this.w*0.12, this.h*0.18, 0, 0, Math.PI*2);
    this.ctx.fill();
  }
  drawHeatHaze(){
    // shimmering haze above
    const y0 = this.h*0.35, y1 = this.h*0.62;
    const grd = this.ctx.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0, 'rgba(255,170,80,0)');
    grd.addColorStop(1, 'rgba(255,170,80,0.08)');
    this.ctx.fillStyle = grd;
    this.ctx.fillRect(0, y0, this.w, y1-y0);
  }
  loop(timestamp){
    const ctx = this.ctx;
    this.t += 0.016 * this.opts.intensity;

    // clear with subtle night tint
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(8,10,12,0.9)';
    ctx.fillRect(0,0,this.w,this.h);

    // core flame
    this.drawFlameCore();

    // embers
    ctx.globalCompositeOperation = 'lighter';
    for(let i=0;i<this.embers.length;i++){
      const e = this.embers[i];
      const drift = Math.sin((e.y + this.t*120)*0.01) * 0.12 * this.opts.intensity;
      e.vx += (this.opts.wind*0.002 + drift*0.002);
      e.x += e.vx * 60;
      e.y += e.vy * 60;
      e.vy *= 0.994;
      e.age += 16;
      const lifeRatio = 1 - (e.age/e.life);
      const s = e.size * (0.6 + lifeRatio*0.8);
      const a = Math.max(0, e.alpha * lifeRatio);
      // gradient ember
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, s*3);
      g.addColorStop(0, `hsla(${e.hue},100%,70%,${a})`);
      g.addColorStop(1, `hsla(${e.hue},100%,50%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(e.x, e.y, s, 0, Math.PI*2);
      ctx.fill();

      if(e.age >= e.life || e.y < this.h*0.18 || e.x < this.w*0.1 || e.x > this.w*0.9){
        this.embers.splice(i,1); this.spawn(); i--;
      }
    }

    // base glow
    const base = ctx.createRadialGradient(this.w/2, this.h*0.8, 0, this.w/2, this.h*0.8, this.w*0.28);
    base.addColorStop(0, 'rgba(255,180,100,0.22)');
    base.addColorStop(1, 'rgba(255,180,100,0)');
    ctx.fillStyle = base;
    ctx.beginPath(); ctx.ellipse(this.w/2, this.h*0.84, this.w*0.3, this.h*0.08, 0, 0, Math.PI*2); ctx.fill();

    this.drawHeatHaze();

    requestAnimationFrame(this.loop);
  }
}


// ===== Question & Campfire model (frontend demo) =====
let QDB = [];
let todayQuestion = null;

async function loadQuestions(){
  try{
    const res = await fetch('questions.json',{cache:'no-store'});
    const js = await res.json();
    QDB = js.questions || [];
  }catch(_){
    QDB = ["오늘 마음을 가장 흔든 장면은 무엇이었나요?"];
  }
}

function pickTodayQuestion(){
  // deterministic by date
  if(QDB.length===0) return null;
  const seed = seedRand(todayKey());
  const idx = Math.floor(seed()*QDB.length);
  return QDB[idx];
}

function getRoomId(idx){ return `${todayKey()}#room${idx}`; }

// store answers locally per room
function loadRoom(roomId){
  const raw = safeGetItem('room:'+roomId);
  return raw ? JSON.parse(raw) : { answers: [] }; // answer: {uid, text, likes}
}
function saveRoom(roomId, data){
  safeSetItem('room:'+roomId, JSON.stringify(data));
}

// synth peers for demo
function synthPeerAnswers(roomId, question, count=3){
  const data = loadRoom(roomId);
  if(data.answers.length >= count) return;
  const seed = seedRand(roomId+question);
  const samples = [
    "퇴근길 하늘이 분홍색이었어요. 괜히 마음이 가벼워졌어요.",
    "사소하지만, 따뜻한 커피 한 잔이 오늘을 버티게 했어요.",
    "회의에서 내 의견이 채택됐어요. 스스로가 좀 믿어졌달까.",
    "산책하다가 들은 매미 소리가 이상하게 위로가 됐어요.",
    "낡은 노래를 다시 들었는데, 그때의 내가 잠깐 떠올랐어요.",
    "긴장됐지만 한 걸음 냈어요. 그게 오늘의 수확!"
  ];
  while(data.answers.length < count){
    const t = samples[Math.floor(seed()*samples.length)];
    data.answers.push({ uid: 'peer_'+Math.floor(seed()*9999), text: t, likes: Math.floor(seed()*20) });
  }
  saveRoom(roomId, data);
}

// render campfire rooms


function renderCampfires(){
  const grid = $('#campGrid'); if(!grid) return;
  grid.innerHTML = "";

  for(let i=0;i<3;i++){
    const roomId = getRoomId(i);
    const topic  = CAMP_TOPICS[i]?.title || `캠프 ${i+1}`;
    synthPeerAnswers(roomId, topic, 3);
    const data = loadRoom(roomId);
    const totalLikes = data.answers.reduce((a,b)=>a+(b.likes||0),0);

    const wrap = document.createElement('div');
    wrap.className = 'campPitWrap';
    wrap.innerHTML = `
      <div class="campHeader">
        <div style="font-weight:800">${topic}</div>
        <div class="campStats">❤️ ${totalLikes} · 노트 ${data.answers.length}</div>
      </div>
      <div class="campPit">
        <canvas class="campfire"></canvas>
        <div class="stoneRing"></div>
        <div class="logsBar"></div>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn ghost" type="button">열기</button>
        <button class="btn" type="button">이 캠프에 쓰기</button>
      </div>`;

    const c = wrap.querySelector('canvas.campfire');
    const intensity = Math.min(2, 0.9 + ((totalLikes/(data.answers.length||1)) * 0.05));
    new Firepit(c, { intensity, emberCount: 120 + Math.min(200, totalLikes) });

    wrap.querySelector('.btn.ghost').onclick = ()=> openCamp(roomId, i);
    wrap.querySelector('.btn:not(.ghost)').onclick = ()=>{
      const text = (journal?.value || "").trim();
      if(!text){ showToast("위 입력칸에 쓰고 저장하거나, 캠프 안에서 바로 써주세요."); openCamp(roomId, i); return; }
      const d = loadRoom(roomId);
      d.answers.unshift({ uid: state.uid, text, likes:0, ts: Date.now() });
      saveRoom(roomId, d);
      if(typeof updateLengthMeter==='function'){ journal.value=""; updateLengthMeter(); }
      showToast(`"${topic}"에 저장했어요 🔥`);
      renderCampfires();
      openCamp(roomId, i);
    };

    grid.appendChild(wrap);
  }
}


  if(!campGrid) return;
  campGrid.innerHTML = "";
  for(let i=0;i<3;i++){
    const roomId = getRoomId(i);
    synthPeerAnswers(roomId, todayQuestion, 3);
    const data = loadRoom(roomId);
    const totalLikes = data.answers.reduce((a,b)=>a+(b.likes||0),0);
    const el = document.createElement('div');
    el.className='camp';
    el.innerHTML = `<h4>캠프파이어 ${i+1}</h4>
      <div class="subtle">${data.answers.length}개의 답변</div>
      <div class="likes">❤️ ${totalLikes}</div>`;
    el.onclick = ()=> openCamp(roomId);
    campGrid.appendChild(el);
  }
  if(campTitle) campTitle.textContent = todayQuestion || "오늘의 질문";
}

function openCamp(roomId){
  // open modal-like grid (simple inline below grid)
  const data = loadRoom(roomId);
  const wrap = document.createElement('div');
  wrap.className='cards';
  data.answers.forEach((a, idx)=>{
    const item = document.createElement('div'); item.className='cardItem';
    const mine = (a.uid===state.uid) ? `<span class="subtle">MINE</span>` : "";
    item.innerHTML = `<div style="white-space:pre-wrap;line-height:1.4">${mine}${a.text}</div>
      <button class="likeBtn">❤️ ${a.likes||0}</button>`;
    item.querySelector('.likeBtn').onclick = ()=>{
      a.likes = (a.likes||0)+1; saveRoom(roomId, data); renderCampfires(); openCamp(roomId); // re-render
    };
    wrap.appendChild(item);
  });
  campGrid.innerHTML = ""; campGrid.appendChild(wrap);
}

// explore other questions (fake feed)
function renderExplore(){
  if(!exploreGrid) return;
  exploreGrid.innerHTML = "";
  const rand = seedRand(todayKey()+"explore");
  for(let i=0;i<6;i++){
    const qidx = Math.floor(rand()*QDB.length);
    const q = QDB[qidx];
    const card = document.createElement('div'); card.className='cardItem';
    card.innerHTML = `<div style="font-weight:700;margin-bottom:4px">${q}</div>
      <div class="subtle">❤️ ${Math.floor(rand()*300)}  ·  답변 ${10+Math.floor(rand()*90)}</div>
      <button class="likeBtn">내 답 쓰기</button>`;
    card.querySelector('.likeBtn').onclick = ()=>{
      questionCard.textContent = q; location.hash = '#/write'; showPage('#/write');
      showToast("이 질문으로 작성해보세요.");
    };
    exploreGrid.appendChild(card);
  }
}

// save my answer to a room

function saveMyAnswer(){
  const text = (journal?.value || "").trim();
  if(!text){ showToast("내용을 입력해주세요."); return; }

  let roomIdx = currentRoomIdx;
  if(roomIdx==null){
    // default seat by uid+date seed
    const seed = (state.uid||'u') + todayKey();
    let h=0; for(let i=0;i<seed.length;i++) h=(h*31 + seed.charCodeAt(i))|0;
    h = (1103515245*h + 12345) & 0x7fffffff;
    roomIdx = Math.floor((h/0x7fffffff) * 3);
  }
  const roomId = getRoomId(roomIdx);
  const data = loadRoom(roomId);
  data.answers.unshift({ uid: state.uid, text, likes:0, ts: Date.now() });
  saveRoom(roomId, data);

  const len = text.length;
  if(typeof addLogUnits==='function') addLogUnits(1);
  if(typeof addScore==='function') addScore(len>=140?3.5:(len>=70?2.5:1.5));
  showToast(`"${CAMP_TOPICS[roomIdx]?.title || ('캠프 '+(roomIdx+1))}"에 저장했어요 🔥`);
  journal.value=""; if(typeof updateLengthMeter==='function') updateLengthMeter();

  renderCampfires();
  openCamp(roomId, roomIdx);
}


// length meter
function updateLengthMeter(){
  if(!journal || !lenBar || !lengthHint) return;
  const len = journal.value.length;
  lengthHint.textContent = `${len}자` + (len<70 ? " · 조금 더 구체적으로?" : (len<140 ? " · 좋아요, 한 단계 더!" : " · 충분해요!"));
  const pct = Math.min(100, Math.round((len/140)*100)); lenBar.style.width = pct+'%';
}

// probes (simple)
function genProbe(){
  const cands = PROBE.bank?.followups || ["조금 더 풀어줄 수 있을까요?"];
  return cands[Math.floor(Math.random()*cands.length)];
}
function renderProbeChips(){
  const wrap = $('#probeChips'); if(!wrap) return;
  wrap.innerHTML = "";
  for(let i=0;i<3;i++){
    const chip = document.createElement('span'); chip.className='chip'; const q=genProbe();
    chip.textContent=q; chip.onclick=()=>{ journal.value = (journal.value+"\n\n— "+q+"\n").trim(); updateLengthMeter(); };
    wrap.appendChild(chip);
  }
}

// nav & pages
const PAGES = {};
function syncTabs(hash){
  const h = (hash && PAGES[hash]) ? hash : '#/write';
  $('#tabWrite')?.setAttribute('aria-current', h==="#/write" ? 'page':'false');
  $('#tabCamp') ?.setAttribute('aria-current', h==="#/campfire" ? 'page':'false');
}
function showPage(hash){
  const key=(hash && PAGES[hash]) ? hash : '#/write';
  Object.values(PAGES).forEach(v=> v && (v.style.display='none'));
  if(PAGES[key]) PAGES[key].style.display='block';
  syncTabs(key);
  if(key==="#/campfire"){ renderCampfires(); renderExplore(); }
}

// streak
function updateStreak(){
  const today=todayKey();
  const prev=safeGetItem('sunset_last_date');
  if(prev===today) return;
  const y=new Date(); y.setDate(y.getDate()-1);
  state.streak = (prev === y.toISOString().slice(0,10)) ? (state.streak||0)+1 : 1;
  safeSetItem('sunset_last_date', today); saveState(); updateHUD();
}

// init
async function init(){
  loadState();
  // refs
  questionCard = $('#questionCard'); journal=$('#journal'); lenBar=$('#lenBar'); lengthHint=$('#lengthHint'); toast=$('#toast');
  campTitle=$('#campTitle'); campGrid=$('#campGrid'); exploreGrid=$('#exploreGrid');
  levelHint=$('#levelHint'); scoreHint=$('#scoreHint'); streakBadge=$('#streakBadge'); campfireGate=$('#campfireGate');
  // data
  await loadQuestions();
  todayQuestion = pickTodayQuestion();
  if(questionCard) questionCard.textContent = todayQuestion;
  updateHUD(); renderProbeChips(); renderCampfires(); renderExplore();
  // events
  $('#saveBtn')?.addEventListener('click', saveMyAnswer);
  $('#probeBtn')?.addEventListener('click', renderProbeChips);
  $('#nextQ')?.addEventListener('click', ()=>{ todayQuestion = QDB[Math.floor(Math.random()*QDB.length)] || todayQuestion; if(questionCard) questionCard.textContent=todayQuestion; showToast("임의의 질문으로 전환되었습니다."); });
  $('#shareBtn')?.addEventListener('click', ()=>{ location.hash='#/campfire'; showPage('#/campfire'); });
  $('#exploreMore')?.addEventListener('click', renderExplore);
  journal?.addEventListener('input', updateLengthMeter);
  // nav
  PAGES['#/write']=$('#page-write'); PAGES['#/campfire']=$('#page-campfire');
  document.querySelectorAll('button[data-nav]').forEach(btn=> btn.addEventListener('click', ()=>{ const to=btn.getAttribute('data-nav'); if(to){ location.hash=to; showPage(to); } }));
  window.addEventListener('hashchange', ()=>showPage(location.hash)); showPage(location.hash);
}

document.addEventListener('DOMContentLoaded', ()=>{
  init();
});

function openCamp(roomId, idx=0){
  currentRoomIdx = idx;
  const topic = CAMP_TOPICS[idx]?.title || `캠프 ${idx+1}`;
  const data = loadRoom(roomId);
  const grid = $('#campGrid');
  grid.innerHTML = `
    <div class="row" style="margin-bottom:8px">
      <h3 style="margin:0">${topic}</h3>
      <div style="display:flex;gap:8px">
        <button id="editTopicBtn" class="btn ghost" type="button">주제 바꾸기</button>
        <button id="backCamp" class="btn ghost" type="button">목록으로</button>
      </div>
    </div>
    <div class="cards" id="postWrap"></div>
  `;
  const wrap = $('#postWrap');
  data.answers.sort((a,b)=>(b.ts||0)-(a.ts||0)).forEach(a=>{
    const item = document.createElement('div'); item.className='cardItem';
    const mine = a.uid===state.uid ? `<span class="subtle">MINE</span>` : '';
    item.innerHTML = `
      <div style="white-space:pre-wrap;line-height:1.5">${mine}${a.text}</div>
      <button class="likeBtn">❤️ ${a.likes||0}</button>`;
    item.querySelector('.likeBtn').onclick = ()=>{
      a.likes = (a.likes||0)+1; saveRoom(roomId, data); openCamp(roomId, idx);
    };
    wrap.appendChild(item);
  });
  $('#backCamp').onclick = ()=> renderCampfires();
  $('#editTopicBtn').onclick = ()=> promptEditTopic(idx);
}

function promptEditTopic(idx){
  const cur = CAMP_TOPICS[idx]?.title || "";
  const next = prompt("캠프 주제를 입력하세요", cur);
  if(!next) return;
  CAMP_TOPICS[idx] = { id: idx, title: next.trim() || cur };
  saveCampTopics(CAMP_TOPICS);
  showToast("주제가 업데이트되었습니다.");
  renderCampfires();
}
