// ——— State & Storage ———
let state = { uid: 'u'+Math.floor(Math.random()*1e6) };
const $ = sel => document.querySelector(sel);
function safeSetItem(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
function safeGetItem(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function todayKey(){ return new Date().toISOString().slice(0,10); }

// ——— Firepit (Canvas) ———
class Firepit {
  constructor(canvas, opts={}){
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.w = canvas.width = canvas.clientWidth * (devicePixelRatio||1);
    this.h = canvas.height = canvas.clientHeight * (devicePixelRatio||1);
    this.opts = Object.assign({ intensity:1.0, emberCount:140, wind:0.12, hueBase:28 }, opts);
    this.embers = []; this.t=0;
    for(let i=0;i<this.opts.emberCount;i++) this.spawn(true);
    this.loop = this.loop.bind(this); requestAnimationFrame(this.loop);
    addEventListener('resize', ()=>{
      this.w = canvas.width = canvas.clientWidth * (devicePixelRatio||1);
      this.h = canvas.height = canvas.clientHeight * (devicePixelRatio||1);
    });
  }
  rnd(){ return Math.random(); }
  spawn(initial=false){
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
  core(){
    const g = this.ctx.createRadialGradient(this.w/2, this.h*0.72, this.h*0.02, this.w/2, this.h*0.62, this.h*0.22);
    g.addColorStop(0, `rgba(255,250,230,0.95)`);
    g.addColorStop(0.25, `rgba(255,210,140,0.92)`);
    g.addColorStop(0.55, `rgba(255,150,60,0.85)`);
    g.addColorStop(0.8, `rgba(255,110,40,0.55)`);
    g.addColorStop(1, `rgba(40,20,10,0)`);
    this.ctx.globalCompositeOperation = 'lighter';
    this.ctx.fillStyle = g;
    this.ctx.beginPath();
    this.ctx.ellipse(this.w/2, this.h*0.66, this.w*0.12, this.h*0.18, 0, 0, Math.PI*2);
    this.ctx.fill();
  }
  haze(){
    const y0 = this.h*0.35, y1 = this.h*0.62;
    const grd = this.ctx.createLinearGradient(0, y0, 0, y1);
    grd.addColorStop(0,'rgba(255,170,80,0)');
    grd.addColorStop(1,'rgba(255,170,80,0.08)');
    this.ctx.fillStyle = grd; this.ctx.fillRect(0, y0, this.w, y1-y0);
  }
  loop(){
    const ctx = this.ctx; this.t += 0.016*this.opts.intensity;
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='rgba(8,10,12,0.9)'; ctx.fillRect(0,0,this.w,this.h);
    this.core();
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<this.embers.length;i++){
      const e=this.embers[i];
      const drift = Math.sin((e.y + this.t*120)*0.01) * 0.12 * this.opts.intensity;
      e.vx += (this.opts.wind*0.002 + drift*0.002);
      e.x += e.vx*60; e.y += e.vy*60; e.vy *= 0.994; e.age += 16;
      const lifeRatio = 1 - (e.age/e.life);
      const s = e.size * (0.6 + lifeRatio*0.8);
      const a = Math.max(0, e.alpha * lifeRatio);
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, s*3);
      g.addColorStop(0, `hsla(${e.hue},100%,70%,${a})`);
      g.addColorStop(1, `hsla(${e.hue},100%,50%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x,e.y,s,0,Math.PI*2); ctx.fill();
      if(e.age>=e.life || e.y<this.h*0.18 || e.x<this.w*0.1 || e.x>this.w*0.9){ this.embers.splice(i,1); this.spawn(); i--; }
    }
    const base = ctx.createRadialGradient(this.w/2,this.h*0.8,0,this.w/2,this.h*0.8,this.w*0.28);
    base.addColorStop(0,'rgba(255,180,100,0.22)'); base.addColorStop(1,'rgba(255,180,100,0)');
    ctx.fillStyle=base; ctx.beginPath(); ctx.ellipse(this.w/2,this.h*0.84,this.w*0.3,this.h*0.08,0,0,Math.PI*2); ctx.fill();
    this.haze();
    requestAnimationFrame(this.loop);
  }
}

// ——— Topics & Rooms ———
function loadCampTopics(){
  const k = 'camp_topics:'+todayKey();
  const raw = safeGetItem(k);
  if(raw) return JSON.parse(raw);
  const topics = [
    { id:0, title:"오늘의 하이라이트" },
    { id:1, title:"지금 나를 잡아끄는 감정" },
    { id:2, title:"내가 선택할 작은 행동" }
  ];
  safeSetItem(k, JSON.stringify(topics)); return topics;
}
function saveCampTopics(topics){ safeSetItem('camp_topics:'+todayKey(), JSON.stringify(topics)); }
let CAMP_TOPICS = loadCampTopics();
let currentRoomIdx = null;

function getRoomId(idx){ return `${todayKey()}#room${idx}`; }
function loadRoom(roomId){
  const raw = safeGetItem('room:'+roomId);
  return raw ? JSON.parse(raw) : { answers:[] };
}
function saveRoom(roomId, data){ safeSetItem('room:'+roomId, JSON.stringify(data)); }

// ——— UI Helpers ———
function show(section){ section.classList.remove('hidden'); }
function hide(section){ section.classList.add('hidden'); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400); }
function setToday(){ $('#todayStr').textContent = todayKey(); }

// ——— Render Campfires (3) ———
function synthPeerAnswers(roomId, topic, need=3){
  const data = loadRoom(roomId);
  if(data.answers.length >= need) return;
  const samples = [
    "퇴근길 하늘이 분홍색이었어요.", "따뜻한 커피 한 잔이 오늘을 버티게 했어요.",
    "내 의견이 채택됐고 스스로가 믿어졌어요.", "산책 중 매미 소리가 위로가 됐어요.", "오래된 노래가 위로가 됐어요."
  ];
  while(data.answers.length < need){
    const t = samples[Math.floor(Math.random()*samples.length)];
    data.answers.push({ uid:'peer'+Math.floor(Math.random()*9999), text:t, likes:Math.floor(Math.random()*20), ts: Date.now()-Math.floor(Math.random()*86400000) });
  }
  saveRoom(roomId, data);
}

function renderCampfires(){
  const grid = $('#campGrid'); grid.innerHTML = '';
  for(let i=0;i<3;i++){
    const roomId = getRoomId(i);
    const topic = CAMP_TOPICS[i]?.title || `캠프 ${i+1}`;
    synthPeerAnswers(roomId, topic, 3);
    const data = loadRoom(roomId);
    const totalLikes = data.answers.reduce((a,b)=>a+(b.likes||0),0);

    const wrap = document.createElement('div'); wrap.className='campPitWrap';
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
    const intensity = Math.min(2, 0.9 + ((totalLikes/(data.answers.length||1))*0.05));
    new Firepit(c, { intensity, emberCount: 120 + Math.min(200, totalLikes) });

    wrap.querySelector('.btn.ghost').onclick = ()=> openCamp(roomId, i);
    wrap.querySelector('.btn:not(.ghost)').onclick = ()=>{
      const text = ($('#journal')?.value || '').trim();
      if(!text){ toast("위 입력칸에 쓰고 저장하거나, 캠프 안에서 바로 써주세요."); openCamp(roomId, i); return; }
      const d = loadRoom(roomId);
      d.answers.unshift({ uid: state.uid, text, likes:0, ts: Date.now() });
      saveRoom(roomId, d);
      $('#journal').value=''; updateLen();
      toast(`"${topic}"에 저장했어요 🔥`);
      renderCampfires(); openCamp(roomId, i);
    };
    grid.appendChild(wrap);
  }
}

// ——— Room (notes) ———
function openCamp(roomId, idx=0){
  currentRoomIdx = idx;
  const topic = CAMP_TOPICS[idx]?.title || `캠프 ${idx+1}`;
  hide($('#campSection')); show($('#roomSection'));
  $('#roomTitle').textContent = topic;
  const data = loadRoom(roomId);
  const posts = $('#posts'); posts.innerHTML = '';
  data.answers.sort((a,b)=>(b.ts||0)-(a.ts||0)).forEach(a=>{
    const item = document.createElement('div'); item.className='cardItem';
    const mine = a.uid===state.uid ? `<span class="subtle">MINE · </span>` : '';
    item.innerHTML = `<div style="white-space:pre-wrap;line-height:1.5">${mine}${a.text}</div>
                      <button class="likeBtn">❤️ ${a.likes||0}</button>`;
    item.querySelector('.likeBtn').onclick = ()=>{
      a.likes = (a.likes||0)+1; saveRoom(roomId, data); openCamp(roomId, idx);
    };
    posts.appendChild(item);
  });
  $('#backBtn').onclick = ()=>{ hide($('#roomSection')); show($('#campSection')); renderCampfires(); };
  $('#renameBtn').onclick = ()=>{
    const cur = CAMP_TOPICS[idx]?.title || '';
    const next = prompt("캠프 주제를 입력하세요", cur);
    if(!next) return;
    CAMP_TOPICS[idx] = { id: idx, title: next.trim() || cur };
    saveCampTopics(CAMP_TOPICS);
    $('#roomTitle').textContent = CAMP_TOPICS[idx].title;
    renderCampfires();
  };
}

// ——— Save from single input ———
function saveMyAnswer(){
  const text = ($('#journal')?.value || '').trim();
  if(!text){ toast("내용을 입력해주세요."); return; }

  let roomIdx = currentRoomIdx;
  if(roomIdx==null){
    const seed = (state.uid||'u') + todayKey();
    let h=0; for(let i=0;i<seed.length;i++) h=(h*31 + seed.charCodeAt(i))|0;
    h = (1103515245*h + 12345) & 0x7fffffff;
    roomIdx = Math.floor((h/0x7fffffff) * 3);
  }
  const roomId = getRoomId(roomIdx);
  const data = loadRoom(roomId);
  data.answers.unshift({ uid: state.uid, text, likes:0, ts: Date.now() });
  saveRoom(roomId, data);
  $('#journal').value=''; updateLen();
  toast(`"${CAMP_TOPICS[roomIdx]?.title || ('캠프 '+(roomIdx+1))}"에 저장했어요 🔥`);

  openCamp(roomId, roomIdx);
}

// ——— Wire ———
function updateLen(){
  const len = ($('#journal')?.value || '').length;
  const hint = (len<70) ? " · 조금 더 구체적으로 (≥70자)" : (len<140) ? " · 좋아요. 한 단계 더!" : " · 충분해요.";
  $('#lenHint').textContent = `${len}자${len?hint:""}`;
}
document.addEventListener('DOMContentLoaded', ()=>{
  setToday();
  renderCampfires();
  $('#saveBtn').addEventListener('click', saveMyAnswer);
  $('#editTopicsBtn').addEventListener('click', ()=>{
    const titles = CAMP_TOPICS.map(t=>t.title).join("\n");
    const next = prompt("세 줄로 주제를 입력하세요 (줄바꿈으로 구분)", titles);
    if(!next) return;
    const parts = next.split(/\r?\n/).filter(Boolean).slice(0,3);
    while(parts.length<3) parts.push(`캠프 ${parts.length+1}`);
    CAMP_TOPICS = parts.map((t,i)=>({id:i, title:t.trim()}));
    saveCampTopics(CAMP_TOPICS);
    renderCampfires();
  });
  $('#journal').addEventListener('input', updateLen);
});
