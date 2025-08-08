// app.js (동적 로드): 노트 로직만 포함 — 초경량
export const $ = (s)=>document.querySelector(s);
export function todayKey(){ return new Date().toISOString().slice(0,10); }
export function getRoomId(idx){ return `${todayKey()}#room${idx}`; }
export function loadRoom(roomId){ try{const v=localStorage.getItem('room:'+roomId); return v?JSON.parse(v):{answers:[]};}catch(e){return {answers:[]}} }
export function saveRoom(roomId, data){ try{ localStorage.setItem('room:'+roomId, JSON.stringify(data)); }catch(e){} }

function getTopics(){
  try{ const v = localStorage.getItem('camp_topics:'+todayKey()); if(v) return JSON.parse(v);}catch(e){}
  return [{id:0,title:"오늘의 하이라이트"},{id:1,title:"지금 내 감정"},{id:2,title:"내가 선택할 작은 행동"}];
}
let TOPICS = getTopics();
function toast(m){ const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1200); }

export async function openCamp(idx=0){
  const roomId = getRoomId(idx);
  const topic = TOPICS[idx]?.title || `캠프 ${idx+1}`;
  $('#roomTitle').textContent = topic;
  $('#room').classList.remove('hidden');
  $('.wrap > .card:nth-of-type(2)').classList.add('hidden'); // 캠프 리스트 가리기

  function render(){
    const data = loadRoom(roomId);
    const posts = $('#posts'); posts.innerHTML='';
    (data.answers||[]).sort((a,b)=>(b.ts||0)-(a.ts||0)).forEach(a=>{
      const div = document.createElement('div');
      div.className='card';
      div.innerHTML = `<div style="white-space:pre-wrap;line-height:1.6">${a.text}</div>
                       <button class="btn" data-like="${a.ts}">❤️ ${a.likes||0}</button>`;
      posts.appendChild(div);
    });
  }
  render();

  $('#renameBtn').onclick = ()=>{
    const cur = TOPICS[idx]?.title || '';
    const next = prompt('캠프 주제를 입력하세요', cur);
    if(!next) return;
    TOPICS[idx] = {id:idx, title: next.trim()||cur};
    localStorage.setItem('camp_topics:'+todayKey(), JSON.stringify(TOPICS));
    $('#roomTitle').textContent = TOPICS[idx].title;
  };
  $('#backBtn').onclick = ()=>{
    $('#room').classList.add('hidden');
    $('.wrap > .card:nth-of-type(2)').classList.remove('hidden');
  };
  $('#journal').oninput = ()=>{
    const len = $('#journal').value.length;
    $('#len').textContent = len+'자'+(len? (len<70?' · 조금 더 구체적으로 (≥70자)': len<140?' · 좋아요. 한 단계 더!':' · 충분해요.') : '');
  };
  $('#saveBtn').onclick = ()=>{
    const text = $('#journal').value.trim();
    if(!text) { toast('내용을 입력하세요.'); return; }
    const data = loadRoom(roomId);
    data.answers = [{ text, likes:0, ts: Date.now() }, ...(data.answers||[])];
    saveRoom(roomId, data);
    $('#journal').value=''; $('#len').textContent='0자';
    toast(`"${topic}"에 저장했어요 🔥`);
    render();
  };

  // 좋아요 이벤트 위임
  $('#posts').onclick = (e)=>{
    const btn = e.target.closest('button[data-like]'); if(!btn) return;
    const ts = +btn.dataset.like;
    const data = loadRoom(roomId);
    const item = (data.answers||[]).find(a=>a.ts===ts);
    if(item){ item.likes=(item.likes||0)+1; saveRoom(roomId, data); render(); }
  };
}
