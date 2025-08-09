
// lazy-app.js: loaded on first interaction
const $=s=>document.querySelector(s);
const today=()=>new Date().toISOString().slice(0,10);
let CURRENT_IDX=null;
export function getCurrentIdx(){ return CURRENT_IDX; }

function roomId(i){ return `${today()}#room${i}`; }
function loadRoom(i){
  const raw = localStorage.getItem('room:'+roomId(i));
  return raw ? JSON.parse(raw) : { answers: [] };
}
function saveRoom(i, data){
  localStorage.setItem('room:'+roomId(i), JSON.stringify(data));
}

export function openRoom(i, TOPICS, setStats, setTitle, showRoom, showList, toast){
  CURRENT_IDX=i;
  const t = TOPICS[i]?.title || `캠프 ${i+1}`;
  setTitle(t); showRoom();
  const data = loadRoom(i);
  data.answers.sort((a,b)=>(b.ts||0)-(a.ts||0));
  const posts = $('#posts'); posts.innerHTML='';
  data.answers.forEach(a=>{
    const d = document.createElement('div'); d.className='card'; d.style.marginBottom='8px';
    d.innerHTML = `<div style="white-space:pre-wrap;line-height:1.5">${a.text}</div>
                   <button class="btn ghost" data-like>❤️ ${a.likes||0}</button>`;
    d.querySelector('[data-like]').addEventListener('click', ()=>{
      a.likes=(a.likes||0)+1; saveRoom(i,data); setStats(i, sumLikes(data), data.answers.length); openRoom(i, TOPICS, setStats, setTitle, showRoom, showList, toast);
    });
    posts.appendChild(d);
  });
  setStats(i, sumLikes(data), data.answers.length);
}

function sumLikes(d){ return d.answers.reduce((s,a)=>s+(a.likes||0),0); }

export function saveQuick(i, text, TOPICS, setStats, toast){
  const d = loadRoom(i);
  d.answers.unshift({ uid: 'me', text, likes:0, ts: Date.now() });
  saveRoom(i, d);
  setStats(i, sumLikes(d), d.answers.length);
  toast(`"${TOPICS[i]?.title || ('캠프 '+(i+1))}"에 저장했어요 🔥`);
}

export function saveAuto(text, TOPICS, setStats, toast){
  // If no room open, auto-assign (stable per user/day)
  const seed = (localStorage.getItem('uid') || (function(){ const u='u'+Math.floor(Math.random()*1e6); localStorage.setItem('uid',u); return u; })()) + today();
  let h=0; for(let i=0;i<seed.length;i++) h=(h*31 + seed.charCodeAt(i))|0;
  h = (1103515245*h + 12345) & 0x7fffffff;
  const idx = Math.floor((h/0x7fffffff)*3);
  saveQuick(idx, text, TOPICS, setStats, toast);
}

export default null;
