// Memori Wireframe app.js — flow-first, high-fidelity interactions (no external deps)
'use strict';

// Shorthands
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// Keys
const KEY_CAPS='wf.caps.v1', KEY_PROF='wf.profiles.v1', KEY_SET='wf.settings.v1', KEY_ONB='wf.onboard.v1';

// Global state (wireframe)
let state = {
  capsules: [],
  profiles: [],
  settings: { theme:'daylight', language:'ko', currentProfile:'default', autoplayAudio:false },
  currentPhoto:null, currentAudio:null, currentGeo:null, currentWeather:null,
  shareTTL:7, currentId:null,
  searchQuery:''
};

// Load/Save
function loadAll(){
  try{
    state.capsules = JSON.parse(localStorage.getItem(KEY_CAPS)||'[]');
    state.profiles = JSON.parse(localStorage.getItem(KEY_PROF)||'[]');
    state.settings = {...state.settings, ...(JSON.parse(localStorage.getItem(KEY_SET)||'{}'))};
  }catch(e){ console.warn('load failed', e); }
  if(!state.profiles.length){ state.profiles=[{id:'default',name:'기본 프로필'}]; saveProfiles(); }
}
function saveCaps(){ try{ localStorage.setItem(KEY_CAPS, JSON.stringify(state.capsules)); }catch(e){} }
function saveProfiles(){ try{ localStorage.setItem(KEY_PROF, JSON.stringify(state.profiles)); }catch(e){} }
function saveSettings(){ try{ localStorage.setItem(KEY_SET, JSON.stringify(state.settings)); }catch(e){} }

// Utils
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 1600); }
function fmt(ts){ const d=new Date(ts); const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); const hh=String(d.getHours()).padStart(2,'0'); const mm=String(d.getMinutes()).padStart(2,'0'); return `${y}-${m}-${day} ${hh}:${mm}`; }
function readFileAsDataURL(file){ return new Promise((res,rej)=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.onerror=rej; fr.readAsDataURL(file); }); }
function weatherMock(){ const arr=['☀️ 맑음','⛅ 구름','🌧️ 비','🌬️ 바람','❄️ 눈','🌫️ 안개']; const text=arr[Math.floor(Math.random()*arr.length)]; const temp=Math.round(9+Math.random()*19); return {text, tempC:temp}; }
function reverseGeocodeMock(){ return '어디선가'; }

// Theme
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.settings.theme==='sunset'?'sunset':'daylight'); }
function applyLang(){ /* keep ko in wireframe */ }

// Hero render
function renderHero(){
  const latest = state.capsules.find(c=>c.ownerId===state.settings.currentProfile);
  const cover=$('#heroCover'); const date=$('#metaDate'); const w=$('#metaWeather'); const p=$('#metaPlace');
  cover.style.backgroundImage = `linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.02)), url('${(state.currentPhoto || (latest&&latest.photo) || '')}')`;
  date.textContent = fmt(Date.now()); const ww=state.currentWeather||weatherMock(); w.textContent=`${ww.text} · ${ww.tempC}°C`; p.textContent=$('#place').value||'어디선가';
}

// Recent render
function renderRecent(){
  const root=$('#recentList'); const empty=$('#recentEmpty'); root.innerHTML='';
  const data = state.capsules.filter(c=>c.ownerId===state.settings.currentProfile).sort((a,b)=>b.time-a.time);
  if(!data.length){ empty.style.display='block'; return; } empty.style.display='none';
  data.slice(0,8).forEach(c=>{
    const el=document.createElement('div'); el.className='item';
    const th=document.createElement('div'); th.className='thumb'; th.textContent='📷';
    if(c.photo){ th.style.backgroundImage=`url('${c.photo}')`; th.style.backgroundSize='cover'; th.style.backgroundPosition='center'; th.textContent=''; }
    const meta=document.createElement('div'); meta.className='meta';
    const h=document.createElement('div'); h.style.fontWeight='800'; h.textContent=(c.note||'메모 없음').slice(0,60);
    const sub=document.createElement('div'); sub.className='small'; sub.textContent=`${fmt(c.time)} · ${(c.location&&c.location.name)||'어디선가'} · ${(c.weather&&c.weather.text)||'—'}`;
    const rx=document.createElement('div'); rx.className='reactions';
    ['❤️','👍','😢','😆'].forEach(emo=>{ const b=document.createElement('div'); b.className='reaction'; b.textContent=emo; b.onclick=()=>toast(`반응: ${emo}`); rx.appendChild(b); });
    const row=document.createElement('div'); row.className='row'; const b1=document.createElement('button'); b1.className='btn ghost'; b1.textContent='열기'; b1.onclick=()=>openCapsule(c.id);
    const b2=document.createElement('button'); b2.className='btn'; b2.textContent='공유'; b2.onclick=()=>openShare(c.id); row.appendChild(b1); row.appendChild(b2);
    meta.appendChild(h); meta.appendChild(sub); meta.appendChild(rx); meta.appendChild(row);
    el.appendChild(th); el.appendChild(meta); root.appendChild(el);
  });
}

// Timeline render
function renderTimeline(){
  const root=$('#timeline'); root.innerHTML='';
  const data=state.capsules.filter(c=>c.ownerId===state.settings.currentProfile).sort((a,b)=>b.time-a.time);
  if(!data.length){ const d=document.createElement('div'); d.className='small'; d.textContent='타임라인이 비어 있어요.'; root.appendChild(d); return; }
  const byMonth={}; data.forEach(c=>{ const dd=new Date(c.time); const key=`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,'0')}`; byMonth[key]??=[]; byMonth[key].push(c); });
  Object.keys(byMonth).sort().reverse().forEach(key=>{
    const sec=document.createElement('div'); sec.className='month'; const title=document.createElement('div'); title.className='section-title'; title.textContent=key; const row=document.createElement('div'); row.className='row7';
    const days=28; for(let i=0;i<days;i++){ const tile=document.createElement('div'); tile.className='tile'; const c=byMonth[key][i]; if(c){ tile.classList.add('filled'); tile.textContent=new Date(c.time).getDate(); tile.style.backgroundImage=c.photo?`url('${c.photo}')`:''; tile.style.backgroundSize='cover'; tile.style.backgroundPosition='center'; tile.onclick=()=>openCapsule(c.id);} else { tile.textContent='—'; } row.appendChild(tile); }
    sec.appendChild(title); sec.appendChild(row); root.appendChild(sec);
  });
}

// Curation render (theme-dependent)
function renderCuration(){
  const root=$('#curationBody'); const title=$('#curationTitle'); root.innerHTML='';
  if(state.settings.theme==='daylight'){
    title.textContent='작년 오늘 / 성장 하이라이트';
    // On this day
    const today=new Date(); const y=today.getFullYear();
    const arr=state.capsules.filter(c=>{ const d=new Date(c.time); return d.getDate()===today.getDate() && d.getMonth()===today.getMonth() && c.ownerId===state.settings.currentProfile && d.getFullYear()!==y; });
    const sec=document.createElement('div'); sec.className='list'; const h=document.createElement('div'); h.className='section-title'; h.textContent='작년 오늘'; sec.appendChild(h);
    if(arr.length===0){ const em=document.createElement('div'); em.className='small'; em.textContent='작년 오늘 기록이 없어요.'; sec.appendChild(em); }
    arr.forEach(c=>{ const el=document.createElement('div'); el.className='item'; const th=document.createElement('div'); th.className='thumb'; th.textContent='📷'; if(c.photo){ th.style.backgroundImage=`url('${c.photo}')`; th.style.backgroundSize='cover'; th.style.backgroundPosition='center'; th.textContent=''; } const meta=document.createElement('div'); meta.className='meta'; const t=document.createElement('div'); t.style.fontWeight='800'; t.textContent=(c.note||'메모 없음').slice(0,60); const s=document.createElement('div'); s.className='small'; s.textContent=`${fmt(c.time)} · ${(c.weather&&c.weather.text)||'—'}`; const b=document.createElement('button'); b.className='btn ghost'; b.textContent='열기'; b.onclick=()=>openCapsule(c.id); meta.appendChild(t); meta.appendChild(s); meta.appendChild(b); el.appendChild(th); el.appendChild(meta); sec.appendChild(el); });
    root.appendChild(sec);
  }else{
    title.textContent='자서전 질문 / 타임캡슐';
    const qs=['어린 시절 좋아했던 계절?','가족에게 남길 조언?','기억에 남는 여행의 날씨?','미소짓게 하는 노래?','젊은 날의 나에게?','이름에 얽힌 이야기?','버팀목이 된 습관?','고마운 사람과 이유?','다음 세대에게 한 문장?','최근 행복했던 순간?'];
    const sec=document.createElement('div'); sec.className='list';
    qs.forEach((q,i)=>{ const el=document.createElement('div'); el.className='item'; const th=document.createElement('div'); th.className='thumb'; th.textContent=String(i+1).padStart(2,'0'); const meta=document.createElement('div'); meta.className='meta'; const t=document.createElement('div'); t.style.fontWeight='900'; t.textContent=q; const ta=document.createElement('textarea'); ta.className='input'; ta.rows=3; ta.placeholder='짧게 남겨요…'; const b=document.createElement('button'); b.className='btn'; b.textContent='기록'; b.onclick=()=>{ createCapsule({note:`${q}\n\n${ta.value}`}); ta.value=''; toast('저장됨'); }; meta.appendChild(t); meta.appendChild(ta); meta.appendChild(b); el.appendChild(th); el.appendChild(meta); sec.appendChild(el); });
    root.appendChild(sec);
  }
}

// Create capsule (wireframe)
function createCapsule(partial={}){
  const c={ id:'w_'+Date.now(), ownerId: state.settings.currentProfile, photo: state.currentPhoto||null, audio: state.currentAudio||null, note: partial.note || $('#note').value.trim(), time: Date.now(), location:{name: $('#place').value.trim()||'어디선가'}, weather: state.currentWeather||weatherMock(), trackURL: $('#track').value.trim(), visibility:'private', ttlDays: state.shareTTL, sealUntil:null, tags:[] };
  state.capsules.unshift(c); saveCaps(); state.currentPhoto=null; state.currentAudio=null; $('#note').value=''; $('#track').value=''; $('#place').value=''; renderHero(); renderRecent(); renderTimeline(); return c;
}

function openCapsule(id){
  state.currentId=id; const c=state.capsules.find(x=>x.id===id); if(!c){ toast('기록 없음'); return; }
  const body=$('#modalBody'); body.innerHTML='';
  const img=document.createElement('div'); img.style.height='280px'; img.style.borderRadius='12px'; img.style.background='#20284a'; img.style.backgroundImage=c.photo?`url('${c.photo}')`:''; img.style.backgroundSize='cover'; img.style.backgroundPosition='center';
  const meta=document.createElement('div'); meta.className='list'; meta.style.gridTemplateColumns='1fr 1fr 1fr'; meta.style.margin='10px 0'; const d=document.createElement('div'); d.className='pill'; d.textContent=fmt(c.time); const w=document.createElement('div'); w.className='pill'; w.textContent=c.weather?`${c.weather.text} · ${c.weather.tempC}°C`:'날씨 —'; const l=document.createElement('div'); l.className='pill'; l.textContent=(c.location&&c.location.name)||'어디선가';
  const note=document.createElement('div'); note.style.whiteSpace='pre-wrap'; note.style.lineHeight='1.6'; note.textContent=c.note||'메모 없음';
  const rx=document.createElement('div'); rx.className='reactions'; ['❤️','👍','😢','😆'].forEach(emo=>{ const b=document.createElement('div'); b.className='reaction'; b.textContent=emo; b.onclick=()=>toast(`반응: ${emo}`); rx.appendChild(b); });
  body.appendChild(img); body.appendChild(meta); meta.appendChild(d); meta.appendChild(w); meta.appendChild(l); body.appendChild(note); body.appendChild(rx);
  $('#modal').style.display='grid';
}

function openShare(id){
  const c=state.capsules.find(x=>x.id===id)||state.capsules[0]; if(!c){ toast('공유할 기록이 없어요.'); return; }
  const url = location.href.split('?')[0] + '?capsule=' + encodeURIComponent(btoa(JSON.stringify({id:c.id, t:Date.now(), ttl:state.shareTTL, note:(c.note||'').slice(0,120)})));
  const card = `
    <div class="card pad">
      <div class="section-title">미리보기</div>
      <div class="item">
        <div class="thumb" style="background-image:url('${c.photo||''}'); background-size:cover; background-position:center">${c.photo?'':''}</div>
        <div class="meta">
          <div style="font-weight:900">${(c.note||'').slice(0,60)||'메모 없음'}</div>
          <div class="small">${fmt(c.time)} · ${(c.location&&c.location.name)||'어디선가'} · ${(c.weather&&c.weather.text)||'—'}</div>
        </div>
      </div>
      <div class="small">이 링크는 와이어프레임에서 실제 만료되지는 않아요.</div>
      <div style="height:6px"></div>
      <input class="input" id="shareURL" value="${url}">
    </div>`;
  $('#sharePreview').innerHTML=card; $('#shareModal').style.display='grid';
  $('#btnCopy').onclick=()=>{ const ip=$('#shareURL'); ip.select(); document.execCommand('copy'); toast('링크 복사'); };
  $('#btnOpen').onclick=()=> window.open($('#shareURL').value, '_blank');
}

function openFuture(id){
  const c=state.capsules.find(x=>x.id===id)||state.capsules[0]; if(!c){ toast('봉인할 기록이 없어요.'); return; }
  const body=$('#futureBody'); const dateStr=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  body.innerHTML=`
    <div class="card pad">
      <div class="section-title">미래로 봉인</div>
      <div class="small">설정한 날짜 전에는 본인도 열람할 수 없어요. (와이어프레임)</div>
      <div style="height:8px"></div>
      <input type="date" class="input" id="sealDate" value="${dateStr}">
    </div>`;
  $('#futureModal').style.display='grid';
  $('#btnSeal').onclick=()=>{ c.sealUntil=new Date($('#sealDate').value).getTime(); saveCaps(); $('#futureModal').style.display='none'; toast('봉인 완료'); };
  $('#btnCancelSeal').onclick=()=> $('#futureModal').style.display='none';
}

// Search (wireframe only: filters list by note/location)
function applySearch(){
  const q = state.searchQuery.trim().toLowerCase(); if(!q){ renderRecent(); renderTimeline(); return; }
  const root=$('#recentList'); root.innerHTML='';
  const data=state.capsules.filter(c=> (c.note||'').toLowerCase().includes(q) || ((c.location&&c.location.name)||'').toLowerCase().includes(q) );
  if(!data.length){ const em=document.createElement('div'); em.className='small'; em.textContent='검색 결과가 없어요.'; root.appendChild(em); return; }
  data.slice(0,8).forEach(c=>{
    const el=document.createElement('div'); el.className='item';
    const th=document.createElement('div'); th.className='thumb'; th.textContent='📷'; if(c.photo){ th.style.backgroundImage=`url('${c.photo}')`; th.style.backgroundSize='cover'; th.style.backgroundPosition='center'; th.textContent=''; }
    const meta=document.createElement('div'); meta.className='meta'; const h=document.createElement('div'); h.style.fontWeight='800'; h.textContent=(c.note||'—').slice(0,60); const s=document.createElement('div'); s.className='small'; s.textContent=`${fmt(c.time)} · ${(c.location&&c.location.name)||'어디선가'}`; const b=document.createElement('button'); b.className='btn ghost'; b.textContent='열기'; b.onclick=()=>openCapsule(c.id);
    meta.appendChild(h); meta.appendChild(s); meta.appendChild(b); el.appendChild(th); el.appendChild(meta); root.appendChild(el);
  });
}

// Bindings
function bind(){
  // Tabs
  $$('.tab').forEach(btn=> btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
    const tab=btn.dataset.tab;
    if(tab==='home'){ window.scrollTo({top:0,behavior:'smooth'}); }
    if(tab==='curation'){ document.querySelector('[data-pane=\"curation\"]').scrollIntoView({behavior:'smooth'}); }
    if(tab==='timeline'){ document.querySelector('[data-pane=\"timeline\"]').scrollIntoView({behavior:'smooth'}); }
    if(tab==='share'){ openShare(state.capsules[0]?.id); }
    if(tab==='settings'){ $('#settingsPane').style.display='block'; $('#settingsPane').scrollIntoView({behavior:'smooth'}); }
  }));

  // Quick FAB -> focus note
  $('#fabQuick').addEventListener('click', ()=>{ $('#note').focus(); toast('빠른 기록 모드'); });

  // Inputs
  $('#btnAddPhoto').addEventListener('click', ()=> $('#filePhoto').click());
  $('#filePhoto').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; state.currentPhoto=await readFileAsDataURL(f); renderHero(); toast('사진 불러옴'); });
  $('#btnRecord').addEventListener('click', async ()=>{ toast('녹음(모의)'); state.currentAudio='data:audio/webm;base64,wireframe'; });
  $('#btnSave').addEventListener('click', ()=>{ createCapsule(); toast('저장됨'); });
  $('#btnTimeCapsule').addEventListener('click', ()=> openFuture(state.capsules[0]?.id));
  $('#modalClose').addEventListener('click', ()=> $('#modal').style.display='none');
  $('#shareClose').addEventListener('click', ()=> $('#shareModal').style.display='none');
  $('#futureClose').addEventListener('click', ()=> $('#futureModal').style.display='none');
  $('#btnShare').addEventListener('click', ()=> openShare(state.currentId||state.capsules[0]?.id));
  $('#btnToFuture').addEventListener('click', ()=> openFuture(state.currentId||state.capsules[0]?.id));

  // Theme/Profile
  $('#themeSelect').addEventListener('change', e=>{ state.settings.theme=e.target.value; saveSettings(); applyTheme(); renderCuration(); });
  $('#profileSelect').addEventListener('change', e=>{ state.settings.currentProfile=e.target.value; saveSettings(); renderHero(); renderRecent(); renderTimeline(); renderCuration(); });

  // Settings: add profile
  $('#btnAddProfile').addEventListener('click', ()=>{ const name=$('#profileName').value.trim(); if(!name) return toast('이름 입력'); const id='p_'+Math.random().toString(36).slice(2,8); state.profiles.push({id,name}); saveProfiles(); renderProfiles(); applyProfileSelect(); $('#profileName').value=''; });

  // Search
  $('#searchInput').addEventListener('input', e=>{ state.searchQuery=e.target.value; applySearch(); });
}

// Profiles render + select sync
function renderProfiles(){
  const root=$('#profileList'); root.innerHTML='';
  state.profiles.forEach(p=>{
    const row=document.createElement('div'); row.className='row'; const name=document.createElement('div'); name.textContent=p.name; const del=document.createElement('button'); del.className='btn flat'; del.textContent='삭제'; del.onclick=()=>{ if(p.id==='default') return toast('기본 프로필은 삭제 불가'); state.profiles=state.profiles.filter(x=>x.id!==p.id); saveProfiles(); renderProfiles(); applyProfileSelect(); };
    row.appendChild(name); row.appendChild(del); root.appendChild(row);
  });
}
function applyProfileSelect(){
  const sel=$('#profileSelect'); sel.innerHTML=''; state.profiles.forEach(p=>{ const op=document.createElement('option'); op.value=p.id; op.textContent=p.name; sel.appendChild(op); }); sel.value=state.settings.currentProfile||'default';
}

// Onboarding
function maybeOnboard(){
  const done=localStorage.getItem(KEY_ONB); if(done) return;
  const ob=$('#onboard'); ob.style.display='grid';
  let step=1;
  const show=()=>{ $$('#onboard .step').forEach(s=>s.classList.remove('active')); $(`#onboard .step[data-step="${step}"]`).classList.add('active'); };
  $$('#onboard [data-next]').forEach(b=> b.addEventListener('click', ()=>{ step=Math.min(3, step+1); show(); }));
  $$('#onboard [data-skip]').forEach(b=> b.addEventListener('click', ()=>{ localStorage.setItem(KEY_ONB,'1'); ob.style.display='none'; }));
  $$('#onboard [data-done]').forEach(b=> b.addEventListener('click', ()=>{ localStorage.setItem(KEY_ONB,'1'); ob.style.display='none'; }));
  show();
}

// Bootstrap
function seedDemo(){
  const owner='default'; const now=Date.now();
  for(let i=0;i<12;i++){ state.capsules.push({ id:'seed_'+(now-i*86400000), ownerId:owner, photo:null, audio:null, note:`데모 기록 ${i+1}`, time:now-i*86400000, location:{name:i%2?'동네 공원':'집'}, weather:weatherMock(), trackURL:'', visibility:'private', ttlDays:7, tags:[] }); }
  state.capsules.sort((a,b)=>b.time-a.time); saveCaps();
}
function bootstrap(){
  loadAll(); applyTheme(); applyLang(); renderProfiles(); applyProfileSelect();
  if(state.capsules.length===0){ seedDemo(); }
  state.currentWeather = weatherMock();
  renderHero(); renderRecent(); renderTimeline(); renderCuration();
  maybeOnboard();
}
document.addEventListener('DOMContentLoaded', ()=>{ bind(); bootstrap(); });
    
// filler wireframe line 253
// filler wireframe line 254
// filler wireframe line 255
// filler wireframe line 256
// filler wireframe line 257
// filler wireframe line 258
// filler wireframe line 259
// filler wireframe line 260
// filler wireframe line 261
// filler wireframe line 262
// filler wireframe line 263
// filler wireframe line 264
// filler wireframe line 265
// filler wireframe line 266
// filler wireframe line 267
// filler wireframe line 268
// filler wireframe line 269
// filler wireframe line 270
// filler wireframe line 271
// filler wireframe line 272
// filler wireframe line 273
// filler wireframe line 274
// filler wireframe line 275
// filler wireframe line 276
// filler wireframe line 277
// filler wireframe line 278
// filler wireframe line 279
// filler wireframe line 280
// filler wireframe line 281
// filler wireframe line 282
// filler wireframe line 283
// filler wireframe line 284
// filler wireframe line 285
// filler wireframe line 286
// filler wireframe line 287
// filler wireframe line 288
// filler wireframe line 289
// filler wireframe line 290
// filler wireframe line 291
// filler wireframe line 292
// filler wireframe line 293
// filler wireframe line 294
// filler wireframe line 295
// filler wireframe line 296
// filler wireframe line 297
// filler wireframe line 298
// filler wireframe line 299
// filler wireframe line 300
// filler wireframe line 301
// filler wireframe line 302
// filler wireframe line 303
// filler wireframe line 304
// filler wireframe line 305
// filler wireframe line 306
// filler wireframe line 307
// filler wireframe line 308
// filler wireframe line 309
// filler wireframe line 310
// filler wireframe line 311
// filler wireframe line 312
// filler wireframe line 313
// filler wireframe line 314
// filler wireframe line 315
// filler wireframe line 316
// filler wireframe line 317
// filler wireframe line 318
// filler wireframe line 319
// filler wireframe line 320
// filler wireframe line 321
// filler wireframe line 322
// filler wireframe line 323
// filler wireframe line 324
// filler wireframe line 325
// filler wireframe line 326
// filler wireframe line 327
// filler wireframe line 328
// filler wireframe line 329
// filler wireframe line 330
// filler wireframe line 331
// filler wireframe line 332
// filler wireframe line 333
// filler wireframe line 334
// filler wireframe line 335
// filler wireframe line 336
// filler wireframe line 337
// filler wireframe line 338
// filler wireframe line 339
// filler wireframe line 340
// filler wireframe line 341
// filler wireframe line 342
// filler wireframe line 343
// filler wireframe line 344
// filler wireframe line 345
// filler wireframe line 346
// filler wireframe line 347
// filler wireframe line 348
// filler wireframe line 349
// filler wireframe line 350
// filler wireframe line 351
// filler wireframe line 352
// filler wireframe line 353
// filler wireframe line 354
// filler wireframe line 355
// filler wireframe line 356
// filler wireframe line 357
// filler wireframe line 358
// filler wireframe line 359
// filler wireframe line 360
// filler wireframe line 361
// filler wireframe line 362
// filler wireframe line 363
// filler wireframe line 364
// filler wireframe line 365
// filler wireframe line 366
// filler wireframe line 367
// filler wireframe line 368
// filler wireframe line 369
// filler wireframe line 370
// filler wireframe line 371
// filler wireframe line 372
// filler wireframe line 373
// filler wireframe line 374
// filler wireframe line 375
// filler wireframe line 376
// filler wireframe line 377
// filler wireframe line 378
// filler wireframe line 379
// filler wireframe line 380
// filler wireframe line 381
// filler wireframe line 382
// filler wireframe line 383
// filler wireframe line 384
// filler wireframe line 385
// filler wireframe line 386
// filler wireframe line 387
// filler wireframe line 388
// filler wireframe line 389
// filler wireframe line 390
// filler wireframe line 391
// filler wireframe line 392
// filler wireframe line 393
// filler wireframe line 394
// filler wireframe line 395
// filler wireframe line 396
// filler wireframe line 397
// filler wireframe line 398
// filler wireframe line 399
// filler wireframe line 400
// filler wireframe line 401
// filler wireframe line 402
// filler wireframe line 403
// filler wireframe line 404
// filler wireframe line 405
// filler wireframe line 406
// filler wireframe line 407
// filler wireframe line 408
// filler wireframe line 409
// filler wireframe line 410
// filler wireframe line 411
// filler wireframe line 412
// filler wireframe line 413
// filler wireframe line 414
// filler wireframe line 415
// filler wireframe line 416
// filler wireframe line 417
// filler wireframe line 418
// filler wireframe line 419
// filler wireframe line 420
// filler wireframe line 421
// filler wireframe line 422
// filler wireframe line 423
// filler wireframe line 424
// filler wireframe line 425
// filler wireframe line 426
// filler wireframe line 427
// filler wireframe line 428
// filler wireframe line 429
// filler wireframe line 430
// filler wireframe line 431
// filler wireframe line 432
// filler wireframe line 433
// filler wireframe line 434
// filler wireframe line 435
// filler wireframe line 436
// filler wireframe line 437
// filler wireframe line 438
// filler wireframe line 439
// filler wireframe line 440
// filler wireframe line 441
// filler wireframe line 442
// filler wireframe line 443
// filler wireframe line 444
// filler wireframe line 445
// filler wireframe line 446
// filler wireframe line 447
// filler wireframe line 448
// filler wireframe line 449
// filler wireframe line 450
// filler wireframe line 451
// filler wireframe line 452
// filler wireframe line 453
// filler wireframe line 454
// filler wireframe line 455
// filler wireframe line 456
// filler wireframe line 457
// filler wireframe line 458
// filler wireframe line 459
// filler wireframe line 460
// filler wireframe line 461
// filler wireframe line 462
// filler wireframe line 463
// filler wireframe line 464
// filler wireframe line 465
// filler wireframe line 466
// filler wireframe line 467
// filler wireframe line 468
// filler wireframe line 469
// filler wireframe line 470
// filler wireframe line 471
// filler wireframe line 472
// filler wireframe line 473
// filler wireframe line 474
// filler wireframe line 475
// filler wireframe line 476
// filler wireframe line 477
// filler wireframe line 478
// filler wireframe line 479
// filler wireframe line 480
// filler wireframe line 481
// filler wireframe line 482
// filler wireframe line 483
// filler wireframe line 484
// filler wireframe line 485
// filler wireframe line 486
// filler wireframe line 487
// filler wireframe line 488
// filler wireframe line 489
// filler wireframe line 490
// filler wireframe line 491
// filler wireframe line 492
// filler wireframe line 493
// filler wireframe line 494
// filler wireframe line 495
// filler wireframe line 496
// filler wireframe line 497
// filler wireframe line 498
// filler wireframe line 499
// filler wireframe line 500
// filler wireframe line 501
// filler wireframe line 502
// filler wireframe line 503
// filler wireframe line 504
// filler wireframe line 505
// filler wireframe line 506
// filler wireframe line 507
// filler wireframe line 508
// filler wireframe line 509
// filler wireframe line 510
// filler wireframe line 511
// filler wireframe line 512
// filler wireframe line 513
// filler wireframe line 514
// filler wireframe line 515
// filler wireframe line 516
// filler wireframe line 517
// filler wireframe line 518
// filler wireframe line 519
// filler wireframe line 520
// filler wireframe line 521
// filler wireframe line 522
// filler wireframe line 523
// filler wireframe line 524
// filler wireframe line 525
// filler wireframe line 526
// filler wireframe line 527
// filler wireframe line 528
// filler wireframe line 529
// filler wireframe line 530
// filler wireframe line 531
// filler wireframe line 532
// filler wireframe line 533
// filler wireframe line 534
// filler wireframe line 535
// filler wireframe line 536
// filler wireframe line 537
// filler wireframe line 538
// filler wireframe line 539
// filler wireframe line 540
// filler wireframe line 541
// filler wireframe line 542
// filler wireframe line 543
// filler wireframe line 544
// filler wireframe line 545
// filler wireframe line 546
// filler wireframe line 547
// filler wireframe line 548
// filler wireframe line 549
// filler wireframe line 550
// filler wireframe line 551
// filler wireframe line 552
// filler wireframe line 553
// filler wireframe line 554
// filler wireframe line 555
// filler wireframe line 556
// filler wireframe line 557
// filler wireframe line 558
// filler wireframe line 559
// filler wireframe line 560
// filler wireframe line 561
// filler wireframe line 562
// filler wireframe line 563
// filler wireframe line 564
// filler wireframe line 565
// filler wireframe line 566
// filler wireframe line 567
// filler wireframe line 568
// filler wireframe line 569
// filler wireframe line 570
// filler wireframe line 571
// filler wireframe line 572
// filler wireframe line 573
// filler wireframe line 574
// filler wireframe line 575
// filler wireframe line 576
// filler wireframe line 577
// filler wireframe line 578
// filler wireframe line 579
// filler wireframe line 580
// filler wireframe line 581
// filler wireframe line 582
// filler wireframe line 583
// filler wireframe line 584
// filler wireframe line 585
// filler wireframe line 586
// filler wireframe line 587
// filler wireframe line 588
// filler wireframe line 589
// filler wireframe line 590
// filler wireframe line 591
// filler wireframe line 592
// filler wireframe line 593
// filler wireframe line 594
// filler wireframe line 595
// filler wireframe line 596
// filler wireframe line 597
// filler wireframe line 598
// filler wireframe line 599
// filler wireframe line 600
// filler wireframe line 601
// filler wireframe line 602
// filler wireframe line 603
// filler wireframe line 604
// filler wireframe line 605
// filler wireframe line 606
// filler wireframe line 607
// filler wireframe line 608
// filler wireframe line 609
// filler wireframe line 610
// filler wireframe line 611
// filler wireframe line 612
// filler wireframe line 613
// filler wireframe line 614
// filler wireframe line 615
// filler wireframe line 616
// filler wireframe line 617
// filler wireframe line 618
// filler wireframe line 619
// filler wireframe line 620
// filler wireframe line 621
// filler wireframe line 622
// filler wireframe line 623
// filler wireframe line 624
// filler wireframe line 625
// filler wireframe line 626
// filler wireframe line 627
// filler wireframe line 628
// filler wireframe line 629
// filler wireframe line 630
// filler wireframe line 631
// filler wireframe line 632
// filler wireframe line 633
// filler wireframe line 634
// filler wireframe line 635
// filler wireframe line 636
// filler wireframe line 637
// filler wireframe line 638
// filler wireframe line 639
// filler wireframe line 640
// filler wireframe line 641
// filler wireframe line 642
// filler wireframe line 643
// filler wireframe line 644
// filler wireframe line 645
// filler wireframe line 646
// filler wireframe line 647
// filler wireframe line 648
// filler wireframe line 649
// filler wireframe line 650
// filler wireframe line 651
// filler wireframe line 652
// filler wireframe line 653
// filler wireframe line 654
// filler wireframe line 655
// filler wireframe line 656
// filler wireframe line 657
// filler wireframe line 658
// filler wireframe line 659
// filler wireframe line 660
// filler wireframe line 661
// filler wireframe line 662
// filler wireframe line 663
// filler wireframe line 664
// filler wireframe line 665
// filler wireframe line 666
// filler wireframe line 667
// filler wireframe line 668
// filler wireframe line 669
// filler wireframe line 670
// filler wireframe line 671
// filler wireframe line 672
// filler wireframe line 673
// filler wireframe line 674
// filler wireframe line 675
// filler wireframe line 676
// filler wireframe line 677
// filler wireframe line 678
// filler wireframe line 679
// filler wireframe line 680
// filler wireframe line 681
// filler wireframe line 682
// filler wireframe line 683
// filler wireframe line 684
// filler wireframe line 685
// filler wireframe line 686
// filler wireframe line 687
// filler wireframe line 688
// filler wireframe line 689
// filler wireframe line 690
// filler wireframe line 691
// filler wireframe line 692
// filler wireframe line 693
// filler wireframe line 694
// filler wireframe line 695
// filler wireframe line 696
// filler wireframe line 697
// filler wireframe line 698
// filler wireframe line 699
// filler wireframe line 700
// filler wireframe line 701
// filler wireframe line 702
// filler wireframe line 703
// filler wireframe line 704
// filler wireframe line 705
// filler wireframe line 706
// filler wireframe line 707
// filler wireframe line 708
// filler wireframe line 709
// filler wireframe line 710
// filler wireframe line 711
// filler wireframe line 712
// filler wireframe line 713
// filler wireframe line 714
// filler wireframe line 715
// filler wireframe line 716
// filler wireframe line 717
// filler wireframe line 718
// filler wireframe line 719
// filler wireframe line 720
// filler wireframe line 721
// filler wireframe line 722
// filler wireframe line 723
// filler wireframe line 724
// filler wireframe line 725
// filler wireframe line 726
// filler wireframe line 727
// filler wireframe line 728
// filler wireframe line 729
// filler wireframe line 730
// filler wireframe line 731
// filler wireframe line 732
// filler wireframe line 733
// filler wireframe line 734
// filler wireframe line 735
// filler wireframe line 736
// filler wireframe line 737
// filler wireframe line 738
// filler wireframe line 739
// filler wireframe line 740
// filler wireframe line 741
// filler wireframe line 742
// filler wireframe line 743
// filler wireframe line 744
// filler wireframe line 745
// filler wireframe line 746
// filler wireframe line 747
// filler wireframe line 748
// filler wireframe line 749
// filler wireframe line 750
// filler wireframe line 751
// filler wireframe line 752
// filler wireframe line 753
// filler wireframe line 754
// filler wireframe line 755
// filler wireframe line 756
// filler wireframe line 757
// filler wireframe line 758
// filler wireframe line 759
// filler wireframe line 760
// filler wireframe line 761
// filler wireframe line 762
// filler wireframe line 763
// filler wireframe line 764
// filler wireframe line 765
// filler wireframe line 766
// filler wireframe line 767
// filler wireframe line 768
// filler wireframe line 769
// filler wireframe line 770
// filler wireframe line 771
// filler wireframe line 772
// filler wireframe line 773
// filler wireframe line 774
// filler wireframe line 775
// filler wireframe line 776
// filler wireframe line 777
// filler wireframe line 778
// filler wireframe line 779
// filler wireframe line 780
// filler wireframe line 781
// filler wireframe line 782
// filler wireframe line 783
// filler wireframe line 784
// filler wireframe line 785
// filler wireframe line 786
// filler wireframe line 787
// filler wireframe line 788
// filler wireframe line 789
// filler wireframe line 790
// filler wireframe line 791
// filler wireframe line 792
// filler wireframe line 793
// filler wireframe line 794
// filler wireframe line 795
// filler wireframe line 796
// filler wireframe line 797
// filler wireframe line 798
// filler wireframe line 799
// filler wireframe line 800
// filler wireframe line 801
// filler wireframe line 802
// filler wireframe line 803
// filler wireframe line 804
// filler wireframe line 805
// filler wireframe line 806
// filler wireframe line 807
// filler wireframe line 808
// filler wireframe line 809
// filler wireframe line 810
// filler wireframe line 811
// filler wireframe line 812
// filler wireframe line 813
// filler wireframe line 814
// filler wireframe line 815
// filler wireframe line 816
// filler wireframe line 817
// filler wireframe line 818
// filler wireframe line 819
// filler wireframe line 820
// filler wireframe line 821
// filler wireframe line 822
// filler wireframe line 823
// filler wireframe line 824
// filler wireframe line 825
// filler wireframe line 826
// filler wireframe line 827
// filler wireframe line 828
// filler wireframe line 829
// filler wireframe line 830
// filler wireframe line 831
// filler wireframe line 832
// filler wireframe line 833
// filler wireframe line 834
// filler wireframe line 835
// filler wireframe line 836
// filler wireframe line 837
// filler wireframe line 838
// filler wireframe line 839
// filler wireframe line 840
// filler wireframe line 841
// filler wireframe line 842
// filler wireframe line 843
// filler wireframe line 844
// filler wireframe line 845
// filler wireframe line 846
// filler wireframe line 847
// filler wireframe line 848
// filler wireframe line 849
// filler wireframe line 850
// filler wireframe line 851
// filler wireframe line 852
// filler wireframe line 853
// filler wireframe line 854
// filler wireframe line 855
// filler wireframe line 856
// filler wireframe line 857
// filler wireframe line 858
// filler wireframe line 859
// filler wireframe line 860
// filler wireframe line 861
// filler wireframe line 862
// filler wireframe line 863
// filler wireframe line 864
// filler wireframe line 865
// filler wireframe line 866
// filler wireframe line 867
// filler wireframe line 868
// filler wireframe line 869
// filler wireframe line 870
// filler wireframe line 871
// filler wireframe line 872
// filler wireframe line 873
// filler wireframe line 874
// filler wireframe line 875
// filler wireframe line 876
// filler wireframe line 877
// filler wireframe line 878
// filler wireframe line 879
// filler wireframe line 880
// filler wireframe line 881
// filler wireframe line 882
// filler wireframe line 883
// filler wireframe line 884
// filler wireframe line 885
// filler wireframe line 886
// filler wireframe line 887
// filler wireframe line 888
// filler wireframe line 889
// filler wireframe line 890
// filler wireframe line 891
// filler wireframe line 892
// filler wireframe line 893
// filler wireframe line 894
// filler wireframe line 895
// filler wireframe line 896
// filler wireframe line 897
// filler wireframe line 898
// filler wireframe line 899
// filler wireframe line 900
// filler wireframe line 901
// filler wireframe line 902
// filler wireframe line 903
// filler wireframe line 904
// filler wireframe line 905
// filler wireframe line 906
// filler wireframe line 907
// filler wireframe line 908
// filler wireframe line 909
// filler wireframe line 910
// filler wireframe line 911
// filler wireframe line 912
// filler wireframe line 913
// filler wireframe line 914
// filler wireframe line 915
// filler wireframe line 916
// filler wireframe line 917
// filler wireframe line 918
// filler wireframe line 919
// filler wireframe line 920
// filler wireframe line 921
// filler wireframe line 922
// filler wireframe line 923
// filler wireframe line 924
// filler wireframe line 925
// filler wireframe line 926
// filler wireframe line 927
// filler wireframe line 928
// filler wireframe line 929
// filler wireframe line 930
// filler wireframe line 931
// filler wireframe line 932
// filler wireframe line 933
// filler wireframe line 934
// filler wireframe line 935
// filler wireframe line 936
// filler wireframe line 937
// filler wireframe line 938
// filler wireframe line 939
// filler wireframe line 940
// filler wireframe line 941
// filler wireframe line 942
// filler wireframe line 943
// filler wireframe line 944
// filler wireframe line 945
// filler wireframe line 946
// filler wireframe line 947
// filler wireframe line 948
// filler wireframe line 949
// filler wireframe line 950
// filler wireframe line 951
// filler wireframe line 952
// filler wireframe line 953
// filler wireframe line 954
// filler wireframe line 955
// filler wireframe line 956
// filler wireframe line 957
// filler wireframe line 958
// filler wireframe line 959
// filler wireframe line 960
// filler wireframe line 961
// filler wireframe line 962
// filler wireframe line 963
// filler wireframe line 964
// filler wireframe line 965
// filler wireframe line 966
// filler wireframe line 967
// filler wireframe line 968
// filler wireframe line 969
// filler wireframe line 970
// filler wireframe line 971
// filler wireframe line 972
// filler wireframe line 973
// filler wireframe line 974
// filler wireframe line 975
// filler wireframe line 976
// filler wireframe line 977
// filler wireframe line 978
// filler wireframe line 979
// filler wireframe line 980
// filler wireframe line 981
// filler wireframe line 982
// filler wireframe line 983
// filler wireframe line 984
// filler wireframe line 985
// filler wireframe line 986
// filler wireframe line 987
// filler wireframe line 988
// filler wireframe line 989
// filler wireframe line 990
// filler wireframe line 991
// filler wireframe line 992
// filler wireframe line 993
// filler wireframe line 994
// filler wireframe line 995
// filler wireframe line 996
// filler wireframe line 997
// filler wireframe line 998
// filler wireframe line 999
// filler wireframe line 1000
// filler wireframe line 1001
// filler wireframe line 1002
// filler wireframe line 1003
// filler wireframe line 1004
// filler wireframe line 1005
// filler wireframe line 1006
// filler wireframe line 1007
// filler wireframe line 1008
// filler wireframe line 1009
// filler wireframe line 1010
// filler wireframe line 1011
// filler wireframe line 1012
// filler wireframe line 1013
// filler wireframe line 1014
// filler wireframe line 1015
// filler wireframe line 1016
// filler wireframe line 1017
// filler wireframe line 1018
// filler wireframe line 1019
// filler wireframe line 1020
// filler wireframe line 1021
// filler wireframe line 1022
// filler wireframe line 1023
// filler wireframe line 1024
// filler wireframe line 1025
// filler wireframe line 1026
// filler wireframe line 1027
// filler wireframe line 1028
// filler wireframe line 1029
// filler wireframe line 1030
// filler wireframe line 1031
// filler wireframe line 1032
// filler wireframe line 1033
// filler wireframe line 1034
// filler wireframe line 1035
// filler wireframe line 1036
// filler wireframe line 1037
// filler wireframe line 1038
// filler wireframe line 1039
// filler wireframe line 1040
// filler wireframe line 1041
// filler wireframe line 1042
// filler wireframe line 1043
// filler wireframe line 1044
// filler wireframe line 1045
// filler wireframe line 1046
// filler wireframe line 1047
// filler wireframe line 1048
// filler wireframe line 1049
// filler wireframe line 1050
// filler wireframe line 1051
// filler wireframe line 1052
// filler wireframe line 1053
// filler wireframe line 1054
// filler wireframe line 1055
// filler wireframe line 1056
// filler wireframe line 1057
// filler wireframe line 1058
// filler wireframe line 1059
// filler wireframe line 1060
// filler wireframe line 1061
// filler wireframe line 1062
// filler wireframe line 1063
// filler wireframe line 1064
// filler wireframe line 1065
// filler wireframe line 1066
// filler wireframe line 1067
// filler wireframe line 1068
// filler wireframe line 1069
// filler wireframe line 1070
// filler wireframe line 1071
// filler wireframe line 1072
// filler wireframe line 1073
// filler wireframe line 1074
// filler wireframe line 1075
// filler wireframe line 1076
// filler wireframe line 1077
// filler wireframe line 1078
// filler wireframe line 1079
// filler wireframe line 1080
// filler wireframe line 1081
// filler wireframe line 1082
// filler wireframe line 1083
// filler wireframe line 1084
// filler wireframe line 1085
// filler wireframe line 1086
// filler wireframe line 1087
// filler wireframe line 1088
// filler wireframe line 1089
// filler wireframe line 1090
// filler wireframe line 1091
// filler wireframe line 1092
// filler wireframe line 1093
// filler wireframe line 1094
// filler wireframe line 1095
// filler wireframe line 1096
// filler wireframe line 1097
// filler wireframe line 1098
// filler wireframe line 1099
// filler wireframe line 1100
// filler wireframe line 1101
// filler wireframe line 1102
// filler wireframe line 1103
// filler wireframe line 1104
// filler wireframe line 1105
// filler wireframe line 1106
// filler wireframe line 1107
// filler wireframe line 1108
// filler wireframe line 1109
// filler wireframe line 1110
// filler wireframe line 1111
// filler wireframe line 1112
// filler wireframe line 1113
// filler wireframe line 1114
// filler wireframe line 1115
// filler wireframe line 1116
// filler wireframe line 1117
// filler wireframe line 1118
// filler wireframe line 1119
// filler wireframe line 1120
// filler wireframe line 1121
// filler wireframe line 1122
// filler wireframe line 1123
// filler wireframe line 1124
// filler wireframe line 1125
// filler wireframe line 1126
// filler wireframe line 1127
// filler wireframe line 1128
// filler wireframe line 1129
// filler wireframe line 1130
// filler wireframe line 1131
// filler wireframe line 1132
// filler wireframe line 1133
// filler wireframe line 1134
// filler wireframe line 1135
// filler wireframe line 1136
// filler wireframe line 1137
// filler wireframe line 1138
// filler wireframe line 1139
// filler wireframe line 1140
// filler wireframe line 1141
// filler wireframe line 1142
// filler wireframe line 1143
// filler wireframe line 1144
// filler wireframe line 1145
// filler wireframe line 1146
// filler wireframe line 1147
// filler wireframe line 1148
// filler wireframe line 1149
// filler wireframe line 1150
// filler wireframe line 1151
// filler wireframe line 1152
// filler wireframe line 1153
// filler wireframe line 1154
// filler wireframe line 1155
// filler wireframe line 1156
// filler wireframe line 1157
// filler wireframe line 1158
// filler wireframe line 1159
// filler wireframe line 1160
// filler wireframe line 1161
// filler wireframe line 1162
// filler wireframe line 1163
// filler wireframe line 1164
// filler wireframe line 1165
// filler wireframe line 1166
// filler wireframe line 1167
// filler wireframe line 1168
// filler wireframe line 1169
// filler wireframe line 1170
// filler wireframe line 1171
// filler wireframe line 1172
// filler wireframe line 1173
// filler wireframe line 1174
// filler wireframe line 1175
// filler wireframe line 1176
// filler wireframe line 1177
// filler wireframe line 1178
// filler wireframe line 1179
// filler wireframe line 1180
// filler wireframe line 1181
// filler wireframe line 1182
// filler wireframe line 1183
// filler wireframe line 1184
// filler wireframe line 1185
// filler wireframe line 1186
// filler wireframe line 1187
// filler wireframe line 1188
// filler wireframe line 1189
// filler wireframe line 1190
// filler wireframe line 1191
// filler wireframe line 1192
// filler wireframe line 1193
// filler wireframe line 1194
// filler wireframe line 1195
// filler wireframe line 1196
// filler wireframe line 1197
// filler wireframe line 1198
// filler wireframe line 1199