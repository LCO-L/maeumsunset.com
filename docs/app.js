// Perf first: cap DPR & rAF friendly math
const DPR = Math.min( (window.devicePixelRatio||1), 1.5 );

let state = { uid: 'u'+Math.floor(Math.random()*1e6) };
const $ = s=>document.querySelector(s);
function safeSetItem(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function safeGetItem(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
function todayKey(){ return new Date().toISOString().slice(0,10); }
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1100); }
function setToday(){ $('#todayStr').textContent = todayKey(); }
function updateLen(){
  const len = ($('#journal')?.value || '').length;
  const hint = (len<70) ? " · 조금 더 구체적으로 (≥70자)" : (len<140) ? " · 좋아요. 한 단계 더!" : " · 충분해요.";
  $('#lenHint').textContent = `${len}자${len?hint:""}`;
}

// ——— Firepit: lazy + pause when offscreen ———
class Firepit {
  constructor(canvas, opts={}){
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.w = canvas.width = Math.max(1, canvas.clientWidth) * DPR;
    this.h = canvas.height = Math.max(1, canvas.clientHeight) * DPR;
    this.opts = Object.assign({ intensity:0.7, emberCount:80, wind:0.08, hueBase:28 }, opts);
    this.embers = []; this._running=false; this._raf=0; this._last=performance.now();
    for(let i=0;i<this.opts.emberCount;i++) this.spawn(true);

    const ro = new ResizeObserver(()=> this.resize());
    ro.observe(canvas);
    this._io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){ this.start(); } else { this.stop(); }
      });
    }, { threshold: 0.1 });
    this._io.observe(canvas);

    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) this.stop(); else this.start();
    });
  }
  resize(){
    const w = Math.max(1, this.c.clientWidth)*DPR, h=Math.max(1, this.c.clientHeight)*DPR;
    if(w===this.w && h===this.h) return;
    this.w=w; this.h=h; this.c.width=w; this.c.height=h;
  }
  rnd(){ return Math.random(); }
  spawn(initial=false){
    const baseW = this.w * 0.18;
    const x = this.w/2 + (this.rnd()-0.5)*baseW;
    const y = this.h*0.76 + (this.rnd()*4);
    const v = (0.55 + this.rnd()*0.6) * this.opts.intensity;
    const life = 800 + this.rnd()*1100;
    const size = 1.6 + this.rnd()*2.6;
    const hue = this.opts.hueBase + (this.rnd()*10);
    const alpha = .55 + this.rnd()*0.35;
    this.embers.push({x,y, vx:(this.rnd()-0.5)*0.12, vy:-v, life, age: initial? this.rnd()*life:0, size, hue, alpha});
  }
  core(ctx){
    const g = ctx.createRadialGradient(this.w/2, this.h*0.70, this.h*0.02, this.w/2, this.h*0.60, this.h*0.20);
    g.addColorStop(0, `rgba(255,248,228,0.92)`);
    g.addColorStop(0.3, `rgba(255,205,135,0.9)`);
    g.addColorStop(0.6, `rgba(255,140,50,0.7)`);
    g.addColorStop(1, `rgba(40,20,10,0)`);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(this.w/2, this.h*0.64, this.w*0.1, this.h*0.16, 0, 0, Math.PI*2);
    ctx.fill();
  }
  step(dt){
    const ctx=this.ctx;
    ctx.globalCompositeOperation='source-over';
    ctx.fillStyle='rgba(8,10,12,0.92)'; ctx.fillRect(0,0,this.w,this.h);
    this.core(ctx);
    ctx.globalCompositeOperation='lighter';
    for(let i=0;i<this.embers.length;i++){
      const e=this.embers[i];
      const drift = Math.sin((e.y + performance.now()*0.05)*0.01) * 0.12 * this.opts.intensity;
      e.vx += (this.opts.wind*0.002 + drift*0.002) * dt;
      e.x += e.vx*50*dt; e.y += e.vy*50*dt; e.vy *= (1-0.006*dt); e.age += 16*dt;
      const lifeRatio = 1 - (e.age/e.life);
      const s = e.size * (0.6 + Math.max(0,lifeRatio)*0.8);
      const a = Math.max(0, e.alpha * Math.max(0,lifeRatio));
      const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, s*3);
      g.addColorStop(0, `hsla(${e.hue},100%,70%,${a})`);
      g.addColorStop(1, `hsla(${e.hue},100%,50%,0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e.x,e.y,s,0,Math.PI*2); ctx.fill();
      if(e.age>=e.life || e.y<this.h*0.18 || e.x<this.w*0.1 || e.x>this.w*0.9){ this.embers.splice(i,1); this.spawn(); i--; }
    }
    const base = ctx.createRadialGradient(this.w/2,this.h*0.8,0,this.w/2,this.h*0.8,this.w*0.28);
    base.addColorStop(0,'rgba(255,180,100,0.16)'); base.addColorStop(1,'rgba(255,180,100,0)');
    ctx.fillStyle=base; ctx.beginPath(); ctx.ellipse(this.w/2,this.h*0.84,this.w*0.28,this.h*0.07,0,0,Math.PI*2); ctx.fill();
  }
  loop = ()=>{
    if(!this._running) return;
    const now=performance.now(); const dt=Math.min(2,(now-this._last)/16.67); this._last=now;
    this.step(dt);
    this._raf=requestAnimationFrame(this.loop);
  }
  start(){ if(this._running) return; this._running=true; this._last=performance.now(); this._raf=requestAnimationFrame(this.loop); }
  stop(){ if(!this._running) return; this._running=false; cancelAnimationFrame(this._raf); }
}

// ——— Topics & Rooms (localStorage) ———
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
function loadRoom(roomId){ const raw = safeGetItem('room:'+roomId); return raw ? JSON.parse(raw) : { answers:[] }; }
function saveRoom(roomId, data){ safeSetItem('room:'+roomId, JSON.stringify(data)); }

// ——— Lightweight sample filler (only on open) ———
function ensureSome(roomId){
  const data = loadRoom(roomId);
  if(data.answers.length) return data;
  const samples = [
    "퇴근길 하늘이 분홍색이었어요.", "따뜻한 커피 한 잔이 오늘을 버티게 했어요.",
    "내 의견이 채택됐고 스스로가 믿어졌어요."
  ];
  for(const t of samples){
    data.answers.push({ uid:'peer', text:t, likes:Math.floor(Math.random()*9), ts: Date.now()-Math.floor(Math.random()*4e5) });
  }
  saveRoom(roomId, data); return data;
}

// ——— Render: pits only (no data load) ———
const pits = []; // Firepit instances
function renderCampfires(){
  const grid = $('#campGrid'); grid.innerHTML='';
  for(let i=0;i<3;i++){
    const roomId = getRoomId(i);
    const topic = CAMP_TOPICS[i]?.title || `캠프 ${i+1}`;
    const wrap = document.createElement('div'); wrap.className='campPitWrap';
    wrap.innerHTML = `
      <div class="campHeader">
        <div style="font-weight:800">${topic}</div>
        <div class="campStats" id="stat${i}">노트 0</div>
      </div>
      <div class="campPit">
        <canvas class="campfire" id="pit${i}"></canvas>
        <div class="stoneRing"></div>
        <div class="logsBar"></div>
      </div>
      <div class="row" style="margin-top:8px">
        <button class="btn" type="button">열기</button>
        <button class="btn ghost" type="button">이 캠프에 쓰기</button>
      </div>`;
    grid.appendChild(wrap);

    // lazy init canvas
    const c = wrap.querySelector(`#pit${i}`);
    const fp = new Firepit(c, { intensity:0.65, emberCount:64 });
    pits.push(fp);

    wrap.querySelector('.btn').onclick = ()=> openCamp(roomId, i);
    wrap.querySelector('.btn.ghost').onclick = ()=>{
      const text = ($('#journal')?.value || '').trim();
      if(!text){ toast("위 입력칸에 쓰고 저장하거나, 캠프 안에서 바로 써주세요."); openCamp(roomId, i); return; }
      const d = loadRoom(roomId); d.answers.unshift({ uid: state.uid, text, likes:0, ts: Date.now() }); saveRoom(roomId, d);
      $('#journal').value=''; updateLen(); toast(`"${topic}"에 저장했어요 🔥`);
      // update stat quickly without opening
      $('#stat'+i).textContent = `노트 ${d.answers.length}`;
    };

    // quick stat (no sorting)
    const d = loadRoom(roomId); $('#stat'+i).textContent = `노트 ${d.answers.length}`;
  }
}

// ——— Room view: load data on demand ———
function openCamp(roomId, idx=0){
  currentRoomIdx = idx;
  const topic = CAMP_TOPICS[idx]?.title || `캠프 ${idx+1}`;
  $('#roomTitle').textContent = topic;
  $('#roomLoading').style.display='';
  $('#posts').innerHTML = '';
  // show room section
  $('#campSection').classList.add('hidden');
  $('#roomSection').classList.remove('hidden');

  setTimeout(()=>{ // simulate async work & keep UI responsive
    const data = ensureSome(roomId);
    data.answers.sort((a,b)=>(b.ts||0)-(a.ts||0));
    const posts = $('#posts'); posts.innerHTML='';
    for(const a of data.answers){
      const item = document.createElement('div'); item.className='cardItem';
      const mine = a.uid===state.uid ? `<span class="subtle">MINE · </span>` : '';
      item.innerHTML = `<div style="white-space:pre-wrap;line-height:1.5">${mine}${a.text}</div>
                        <button class="likeBtn">❤️ ${a.likes||0}</button>`;
      item.querySelector('.likeBtn').onclick = ()=>{
        a.likes=(a.likes||0)+1; saveRoom(roomId, data); openCamp(roomId, idx);
      };
      posts.appendChild(item);
    }
    $('#roomLoading').style.display='none';
  }, 0);

  $('#backBtn').onclick = ()=>{
    $('#roomSection').classList.add('hidden');
    $('#campSection').classList.remove('hidden');
    renderCampfires();
  };
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

// ——— Save from single input: defer heavy work ———
function saveMyAnswer(){
  const text = ($('#journal')?.value || '').trim();
  if(!text){ toast("내용을 입력해주세요."); return; }

  let roomIdx = currentRoomIdx;
  if(roomIdx==null){ // sticky default
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
  // if in room, refresh quietly
  if(!$('#roomSection').classList.contains('hidden')) openCamp(roomId, roomIdx);
}

// ——— Wire ———
document.addEventListener('DOMContentLoaded', ()=>{
  setToday();
  renderCampfires();
  $('#journal').addEventListener('input', updateLen);
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
});
