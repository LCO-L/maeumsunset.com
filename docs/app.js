let CFG = null;
let state = {
  fireScore: 0, level: 0, streak: 0, yesterday: '',
  longCount: 0, installed: false
};

const QUESTIONS = [
  "오늘 마음을 가장 흔든 장면은 무엇이었나요?",
  "지금 나를 가장 지치게 하는 것은 무엇인가요?",
  "오늘 나를 웃게 만든 작은 순간은 무엇이었나요?",
  "이번 주에 기대하는 일은 무엇인가요?",
  "오늘 하루를 색으로 표현한다면 어떤 색인가요? 왜죠?"
];

const $ = sel => document.querySelector(sel);
const journal = $('#journal');
const lengthHint = $('#lengthHint');
const levelHint = $('#levelHint');
const scoreHint = $('#scoreHint');
const toast = $('#toast');
const streakBadge = $('#streakBadge');
const campfireGate = $('#campfireGate');
const questionCard = $('#questionCard');
const canvas = document.getElementById('campfire');
const ctx = canvas.getContext('2d');

let deferredPrompt = null;

// PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  $('#installBtn').style.display = 'inline-flex';
});
$('#installBtn').addEventListener('click', async ()=>{
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if(outcome === 'accepted'){
    showToast("Dock 보너스! 장작 +1");
    addLogUnits(1);
    state.installed = true;
    saveState();
    $('#dockBanner').classList.remove('show');
  }
  deferredPrompt = null;
});

// Load config + init

// ---- Safe storage wrapper ----
const MemoryStore = { _m: {}, set(k,v){ this._m[k]=v; }, get(k){ return this._m[k]; } };
function safeSetItem(k, v){
  try { localStorage.setItem(k, v); }
  catch(e){ try { indexedDB; /* touch */ MemoryStore.set(k,v); } catch(_) { MemoryStore.set(k,v); } }
}
function safeGetItem(k){
  try { return localStorage.getItem(k); } catch(e){ return MemoryStore.get(k) || null; }
}

async function init(){
  await loadProbeBank();
  try {
    const res = await fetch('campfire_growth_config.json');
    CFG = await res.json();
  } catch(e){
    CFG = { levels: [] };
  }
  // Load state
  const saved = safeGetItem('sunset_state');
  if(saved){ state = {...state, ...JSON.parse(saved)}; }
  // Yesterday preview
  const ys = safeGetItem('sunset_yesterday');
  if(ys) $('#yesterdayPreview').textContent = ys.slice(0, 20) + (ys.length>20?'…':'');

  questionCard.textContent = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
  updateUI();
  drawFire();
  registerSW();
  maybeShowDockBanner();
}
init();

function saveState(){
  safeSetItem('sunset_state', JSON.stringify(state));
}

function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'), 1600);
}

// length tracking + probes
journal.addEventListener('input', ()=>{
  const len = journal.value.length;
  lengthHint.textContent = len + "자";
  // subtle probe
  if(len>0 && len < 50) {
    lengthHint.textContent += " · 조금 더 풀어서 써볼까요?";
  } else if(len>=50 && len<200){
    lengthHint.textContent += " · 좋아요, 디테일을 더!";
  } else if(len>=80){
    lengthHint.textContent += " · 좋아요! 불꽃 업그레이드 보상 대상(≥80자)";
  }
  drawFire(len);
});

$('#nextQ').addEventListener('click', ()=>{
  questionCard.textContent = QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];
});

// Save
$('#saveBtn').addEventListener('click', ()=>{
  const text = journal.value.trim();
  if(text.length === 0){ showToast("내용을 입력해주세요."); return; }
  // Long writing incentives
  const len = text.length;
  if(len < 50){
    addLogUnits(0.5);
    addScore(1 * 1); // minimal
    showToast("짧은 기록 · 장작 +0.5");
  } else if(len < 80){
    addLogUnits(2);
    addScore(1 * 2);
    showToast("좋아요! 장작 +2");
  } else {
    addLogUnits(3);
    addScore(1 * 3);
    showToast("장작이 가득 쌓였습니다! ✨");
    // particles burst visual
    burst();
    state.longCount += 1;
  }
  // save content
  safeSetItem('sunset_last', text);
  const today = new Date().toISOString().slice(0,10);
  localStorage.setItem('sunset_last_date', today);
  // yesterday preview update
  $('#yesterdayPreview').textContent = text.slice(0, 20) + (text.length>20?'…':'');
  // streak update
  updateStreak();
  // reset editor
  journal.value = '';
  lengthHint.textContent = '0자';
  updateUI();
  drawFire();
});

// Share
$('#shareBtn').addEventListener('click', ()=>{
  // Eligibility gate: need 3 long posts
  if((state.longCount||0) < 3){
    showToast(`기록 ${3-(state.longCount||0)}회 더 작성하면 Campfire 공유 가능!`);
    return;
  }
  addScore(3); // share boost
  scalePulse();
  showToast("당신의 불이 캠프를 밝혔습니다.");
  updateUI(); drawFire();
});

// Share-in simulation (Web Share Target alternative for demo)
$('#shareInBtn').addEventListener('click', ()=>{
  const sample = "외부에서 공유된 텍스트가 여기에 들어옵니다.";
  journal.value = sample;
  lengthHint.textContent = sample.length + "자";
  showToast("공유로 열렸습니다.");
});

// score utils
function addScore(n){
  state.fireScore = Math.max(0, Math.round((state.fireScore + n)*10)/10);
  saveState();
}
function addLogUnits(n){
  // visually influence by increasing score slightly
  addScore(n);
}
function updateStreak(){
  const today = new Date().toISOString().slice(0,10);
  const prev = localStorage.getItem('sunset_last_date');
  if(prev === today) return;
  const y = new Date();
  y.setDate(y.getDate()-1);
  const ystr = y.toISOString().slice(0,10);
  if(prev === ystr) state.streak += 1; else state.streak = 1;
  streakBadge.textContent = `연속 ${state.streak}일`;
  saveState();
}

// Level mapping
function getLevel(score){
  const lv = CFG.levels || [];
  for(const L of lv){
    if(score >= L.min_score && (L.max_score === null || score <= L.max_score)){
      return L.level;
    }
  }
  return 0;
}

function updateUI(){
  state.level = getLevel(state.fireScore);
  levelHint.textContent = `L${state.level} · ${CFG.levels[state.level]?.name || '불씨'}`;
  scoreHint.textContent = `score ${state.fireScore}`;
  campfireGate.textContent = `Campfire 입장권: 기록 ${state.longCount}/3`;
  streakBadge.textContent = `연속 ${state.streak}일`;
}

// Simple canvas fire using sprite sheet slices
const sprite = new Image();
sprite.src = 'assets/fire_levels_spritesheet.png';
function drawFire(len=0){
  ctx.clearRect(0,0,canvas.width, canvas.height);
  // logs platform
  ctx.fillStyle = 'rgba(120,82,54,1)';
  ctx.fillRect(100, 300, 600, 20);
  // sprite mapping (4x2 grid -> 8 levels)
  const col = state.level % 4;
  const row = Math.floor(state.level / 4);
  const sw = sprite.width/4;
  const sh = sprite.height/2;
  const sx = col * sw;
  const sy = row * sh;
  const dw = 480, dh = 280;
  const dx = (canvas.width - dw)/2;
  const dy = 20;
  if(sprite.complete){
    ctx.drawImage(sprite, sx, sy, sw, sh, dx, dy, dw, dh);
  } else {
    sprite.onload = ()=> drawFire(len);
  }
  // aura intensity with length hint
  if(len>=80){
    ctx.fillStyle = 'rgba(255,220,120,0.15)';
    ctx.beginPath();
    ctx.ellipse(canvas.width/2, 160, 240, 120, 0, 0, 2*Math.PI);
    ctx.fill();
  }
}

function burst(){
  // quick radial burst
  const t0 = performance.now();
  function frame(t){
    const p = Math.min(1, (t - t0) / 800);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,215,120,${0.6*(1-p)})`;
    ctx.beginPath();
    ctx.arc(canvas.width/2, 140, 40 + 140*p, 0, 2*Math.PI);
    ctx.fill();
    ctx.restore();
    if(p<1) requestAnimationFrame(frame); else drawFire();
  }
  requestAnimationFrame(frame);
}

function scalePulse(){
  // simple canvas scale pulse via redraw burst
  burst();
}

// Dock banner
function maybeShowDockBanner(){
  if(!state.installed){
    $('#dockBanner').classList.add('show');
  }
}
$('#dockOk').addEventListener('click', ()=> $('#dockBanner').classList.remove('show'));

// SW
async function registerSW(){
  if('serviceWorker' in navigator){
    try { await navigator.serviceWorker.register('service-worker.js'); }
    catch(e){ console.log('SW failed', e); }
  }
}


// ---- Probe System (3 Steps) ----
// Steps: 1 사건·상황 → 2 감정·생각 → 3 자기 성찰
const STEPS = [
  {
    name: "① 사건·상황 서술",
    placeholder: "무슨 일이 있었나요? 가능한 구체적으로 적어주세요.",
    probes: [
      "어느 장소에서, 누구와 있었나요?",
      "그 순간에 보았던 것/들었던 소리는 무엇이었나요?",
      "이전과 달랐던 점은 무엇이었나요?"
    ]
  },
  {
    name: "② 감정·생각 구체화",
    placeholder: "그때 어떤 감정/생각이 들었나요? 이유도 적어주세요.",
    probes: [
      "가장 크게 느낀 감정 하나를 고르자면 무엇인가요?",
      "그 감정이 몸에서 어떻게 느껴졌나요? (심장, 호흡, 긴장 등)",
      "그 생각이 생긴 배경에는 어떤 믿음이 있나요?"
    ]
  },
  {
    name: "③ 자기 성찰 요약",
    placeholder: "지금 이 기록이 나에게 주는 의미는 무엇인가요? 다음에 나는 무엇을 선택하나요?",
    probes: [
      "오늘 배운 한 문장은 무엇인가요?",
      "지금 나를 돕는 작은 행동 하나는 무엇인가요?",
      "이 순간을 한 단어로 요약한다면?"
    ]
  }
];

let stepIndex = 0;
let buffers = ["", "", ""];

function loadStep(i){
  stepIndex = Math.max(0, Math.min(2, i));
  $('#stepNow').textContent = (stepIndex+1);
  $('#stepTitle').textContent = STEPS[stepIndex].name;
  const ta = $('#journal');
  ta.placeholder = STEPS[stepIndex].placeholder;
  ta.value = buffers[stepIndex] || '';
  updateLengthHint();
  renderProbes();
}

function renderProbes(){
  const list = $('#probeList');
  list.innerHTML = '';
  STEPS[stepIndex].probes.forEach(q=>{
    const li = document.createElement('li');
    li.textContent = q;
    list.appendChild(li);
  });
}

function updateLengthHint(){
  const len = $('#journal').value.length;
  let msg = len + "자";
  if(len < 70) msg += " · 조금 더 구체적으로 써볼까요? (≥70자)";
  else if(len < 140) msg += " · 좋아요. 한 단계 더!";
  else msg += " · 충분해요. 다음 단계로 넘어가도 좋아요.";
  $('#lengthHint').textContent = msg;
  drawFire(len);
}

$('#journal').removeEventListener('input', ()=>{}); // clear previous binding if any
$('#journal').addEventListener('input', ()=>{
  buffers[stepIndex] = $('#journal').value;
  updateLengthHint();
});

$('#prevStep').addEventListener('click', ()=>{
  if(stepIndex>0) loadStep(stepIndex-1);
});

$('#nextStep').addEventListener('click', ()=>{
  // Enforce 70 chars minimum
  if(($('#journal').value||'').trim().length < 70){
    showToast("이 단계는 최소 70자 이상 써주세요.");
    return;
  }
  buffers[stepIndex] = $('#journal').value;
  if(stepIndex<2) loadStep(stepIndex+1);
  else showToast("모든 단계가 채워졌습니다. 저장을 눌러주세요.");
});

// Override save: require all three steps ≥70
const originalSave = document.getElementById('saveBtn').onclick;
document.getElementById('saveBtn').onclick = null;

document.getElementById('saveBtn').addEventListener('click', ()=>{
  buffers[stepIndex] = $('#journal').value;
  const lengths = buffers.map(t => (t||'').trim().length);
  if(lengths.some(L => L < 70)){
    showToast("세 단계 모두 70자 이상 작성해주세요.");
    return;
  }
  const text = buffers.join("\n\n");
  // long writing incentives by combined length
  const len = text.length;
  if(len < 150){
    addLogUnits(0.5); addScore(1); showToast("짧은 기록 · 장작 +0.5");
  } else if(len < 400){
    addLogUnits(2); addScore(2); showToast("좋아요! 장작 +2");
  } else {
    addLogUnits(3); addScore(3); showToast("장작이 가득 쌓였습니다! ✨"); burst();
    state.longCount += 1;
  }
  safeSetItem('sunset_last', text);
  safeSetItem('sunset_last_date', new Date().toISOString().slice(0,10));
  $('#yesterdayPreview').textContent = text.slice(0, 20) + (text.length>20?'…':'');
  updateStreak();
  // reset editor buffers
  buffers = ["","",""]; loadStep(0);
  updateUI(); drawFire();
});

// Initialize first step after init
document.addEventListener('DOMContentLoaded', ()=>{
  setTimeout(()=> loadStep(0), 0);
});


// ==== Probe system (3-phase) ====
let PROBE = { bank: null };

async function loadProbeBank(){
  try{
    const res = await fetch('probe_bank.json');
    PROBE.bank = await res.json();
  }catch(e){
    PROBE.bank = {phase1:[], phase2:[], phase3:[], followups:[]};
  }
}

const P1 = document.getElementById('phase1');
const P2 = document.getElementById('phase2');
const P3 = document.getElementById('phase3');
const phaseLenHint = document.getElementById('phaseLenHint');
const phaseBadge = document.getElementById('phaseBadge');
const phaseHint  = document.getElementById('phaseHint');
const probeBtn   = document.getElementById('probeBtn');

function currentPhase(){
  const c1 = (P1.value.trim().length >= 70);
  const c2 = (P2.value.trim().length >= 70);
  const c3 = (P3.value.trim().length >= 70);
  const done = [c1,c2,c3].filter(Boolean).length;
  return {done, c1, c2, c3};
}

function updatePhaseUI(){
  const st = currentPhase();
  phaseLenHint.textContent = `${st.done}/3 단계 충족`;
  phaseBadge.textContent = `${Math.max(1, st.done+1)}/3 단계`;
  const labels = ['사건·상황 서술','감정·생각 구체화','자기 성찰 요약'];
  phaseHint.textContent = labels[Math.min(2, st.done)];
}

['input'].forEach(evt=>{
  [P1,P2,P3].forEach(el=> el.addEventListener(evt, ()=>{
    updatePhaseUI();
    // gentle followups for short inputs
    const len = el.value.trim().length;
    if(len>0 && len<70){
      lengthHint.textContent = `${len}자 · 조금 더 구체적으로 적어볼까요?`;
    }
    drawFire(P1.value.length + P2.value.length + P3.value.length);
  }));
});

probeBtn.addEventListener('click', ()=>{
  if(!PROBE.bank) return;
  // pick based on current phase
  const st = currentPhase();
  let pool = PROBE.bank.phase1;
  if(st.done === 1) pool = PROBE.bank.phase2;
  else if(st.done >= 2) pool = PROBE.bank.phase3;
  const q = pool[Math.floor(Math.random()*pool.length)] || PROBE.bank.followups[Math.floor(Math.random()*PROBE.bank.followups.length)] || "조금 더 풀어줄 수 있을까요?";
  questionCard.textContent = q;
  showToast("프로브 질문이 추가되었어요.");
});

// Override save to enforce per-phase >=70 and give rewards
/* unified save handler */
const saveBtn = document.getElementById('saveBtn');
saveBtn.addEventListener('click', ()=>{
  const st = currentPhase();
  /* no min length enforcement */
  const text = (P1.value.trim()+"\n\n"+P2.value.trim()+"\n\n"+P3.value.trim()).trim();
  // Reward by total length: strong boost (>=200)
  const totalLen = text.length;
  // proportional rewards
  let logs = 1, score = 1.5, msg = "기록이 저장되었어요 · 장작 +1";
  if(totalLen >= 50 && totalLen < 120){ logs = 2; score = 2.5; msg = "좋아요! 장작 +2"; }
  else if(totalLen >= 120 && totalLen < 240){ logs = 3; score = 3.5; msg = "멋져요! 장작 +3"; }
  else if(totalLen >= 240){ logs = 4; score = 4.5; msg = "불꽃이 크게 타올라요! 장작 +4 ✨"; burst(); }
  addLogUnits(logs);
  addScore(score);
  showToast(msg);
  // 기록 횟수 기반 게이트(장문 조건 삭제)
  state.longCount = (state.longCount||0) + 1;
  updateStreak();
  // reset
  P1.value = ''; P2.value=''; P3.value='';
  updatePhaseUI();
  updateUI();
  drawFire();
};



// ==== AI-like live probe engine ====
const FEELINGS = [
  {kw:['행복','기쁨','설렘','뿌듯','즐거'], tag:'positive', ask:[
    "그 기쁨을 10점 만점에 몇 점으로 느꼈나요?",
    "그 감정이 오래가도록 내가 붙잡을 한 가지는 무엇일까요?"
  ]},
  {kw:['슬픔','우울','힘들','지침','괴로','눈물'], tag:'sad', ask:[
    "그 슬픔의 무게를 가볍게 하는 작은 행동이 있을까요?",
    "그 감정이 알려주는 필요는 무엇일까요?"
  ]},
  {kw:['분노','화났','짜증','억울','불공'], tag:'anger', ask:[
    "경계가 침해된 지점은 어디였나요?",
    "내가 지키고 싶은 선을 한 줄로 적어볼까요?"
  ]},
  {kw:['불안','걱정','초조','긴장','두려'], tag:'anx', ask:[
    "가장 두려운 시나리오는 무엇이며, 그 확률은 몇 %라고 느끼나요?",
    "지금 바로 할 수 있는 5분짜리 대비 행동은 뭘까요?"
  ]}
];
const CONTEXT = [
  {kw:['회사','팀','프로젝트','미팅','상사','동료'], ask:[
    "이 상황에서 내 역할과 책임을 한 문장으로 정리하면?",
    "상대가 이해하길 바라는 핵심 메시지는 무엇인가요?"
  ]},
  {kw:['가족','엄마','아빠','형','누나','동생','아이','부모'], ask:[
    "그 사람에게 지금 바로 전하고 싶은 말 한 줄은?",
    "경청과 경계 사이에서 내가 선택할 태도는?"
  ]},
  {kw:['학교','수업','시험','숙제','과제'], ask:[
    "이번 경험에서 다음 번에 바꾸고 싶은 단 한 가지는?",
    "오늘 배운 점을 내 언어로 한 줄로 써보면?"
  ]},
  {kw:['돈','계약','비용','예산','투자'], ask:[
    "결정 기준(안전/수익/시간/명예) 중 지금 최우선은?",
    "리스크를 10→7로 낮추는 즉시 행동은 뭘까요?"
  ]}
];

const debounce = (fn, ms=900) => {
  let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); };
};

function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function genProbe(text){
  text = (text||'').slice(-220); // last segment focus
  const probes = [];
  // Feeling-based
  for(const f of FEELINGS){
    if(f.kw.some(k=> text.includes(k))) probes.push(pick(f.ask));
  }
  // Context-based
  for(const c of CONTEXT){
    if(c.kw.some(k=> text.includes(k))) probes.push(pick(c.ask));
  }
  // Fallbacks
  if(/어제|오늘|내일/.test(text)) probes.push("그 시간대의 분위기를 감각(소리/냄새/빛)으로 묘사해볼까요?");
  if(/[?!\.]$/.test(text)) probes.push("방금 문장을 한 단계 더 구체화하면 어떤 디테일이 추가될까요?");
  if(!probes.length) probes.push(pick(PROBE.bank?.followups || ["조금 더 풀어줄 수 있을까요?"]));
  // Dedup
  return [...new Set(probes)].slice(0,3);
}

const probeChips = document.getElementById('probeChips');
const updateProbesDebounced = debounce(()=>{
  const text = (P1.value + " " + P2.value + " " + P3.value).trim();
  if(text.length < 30){ probeChips.innerHTML = ""; return; }
  const qs = genProbe(text);
  probeChips.innerHTML = "";
  qs.forEach(q=>{
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = q;
    chip.onclick = ()=>{
      // Append as guiding question into the current active phase
      const active = document.activeElement && [P1,P2,P3].includes(document.activeElement) ? document.activeElement : P2;
      active.value = (active.value.trim() + "\\n\\n" + "— " + q + "\\n").trim();
      active.dispatchEvent(new Event('input'));
      showToast("프로브가 추가되었어요.");
    };
    probeChips.appendChild(chip);
  });
}, 1000);

// Attach to inputs
[P1,P2,P3].forEach(el=>{
  el.addEventListener('input', updateProbesDebounced);
  el.addEventListener('blur', updateProbesDebounced);
});

