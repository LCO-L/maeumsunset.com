
// SunSet — Autobiography Mode (single-question page)
'use strict';

const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const K_CAP='auto.caps.v1', K_SET='auto.set.v1';

// Life-stage grouped questions
const QUESTIONS=[
  {stage:'유년기', q:'어린 시절 가장 좋아하던 놀이는 무엇이었나요?', hint:'장소, 함께한 사람, 소리/냄새를 떠올리면 좋아요.'},
  {stage:'유년기', q:'부모님 혹은 보호자에게서 배운 소중한 한 가지는?', hint:'말투/표정/습관 같은 디테일을 적어보세요.'},
  {stage:'학생 시절', q:'학교에서 나를 바꿔 놓은 사건은?', hint:'교실, 복도, 계절감 등 감각 묘사'},
  {stage:'학생 시절', q:'친구와의 갈등을 어떻게 풀었나요?', hint:'그때의 감정 키워드를 적어보세요.'},
  {stage:'청년기', q:'스스로를 자랑스러워했던 순간은?', hint:'왜 자랑스러웠는지 이유 1-2개'},
  {stage:'청년기', q:'처음 스스로 결정한 큰 선택은 무엇이었나요?', hint:'결정 전/후의 마음 변화'},
  {stage:'가족', q:'가족에게 꼭 남기고 싶은 말은?', hint:'한 문장으로 요약해보기'},
  {stage:'가족', q:'우리 가족의 소리(목소리/웃음/집 소리)를 묘사해보세요.', hint:'소리와 감정을 연결'}
];

let idx=0;
let caps=JSON.parse(localStorage.getItem(K_CAP)||'[]');

const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1200)};
const readFileAsDataURL=f=>new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(f)});

function render(){
  const it=QUESTIONS[idx];
  $('#qText').textContent=it.q;
  $('#qStage').textContent=it.stage;
  $('#qIndex').textContent=`${idx+1} / ${QUESTIONS.length}`;
  $('#qHint').textContent=it.hint || '힌트';
  const ex = caps.find(c=>c.q===it.q);
  $('#note').value = ex ? ex.note : (it.q + '\\n\\n');
  $('#track').value = ex?.track || '';
  $('#place').value = ex?.place || '';
  renderDots();
}

function renderDots(){
  const root=$('#dots'); root.innerHTML='';
  QUESTIONS.forEach((_,i)=>{
    const d=document.createElement('div'); d.className='dot'+(i===idx?' active':'');
    d.addEventListener('click',()=>{save(false); idx=i; render();});
    root.appendChild(d);
  });
  // stage badges
  const stages = [...new Set(QUESTIONS.map(x=>x.stage))];
  const sb=$('#stageBadges'); sb.innerHTML='';
  stages.forEach(s=>{
    const b=document.createElement('div'); b.className='badge'; b.textContent=s;
    sb.appendChild(b);
  });
}

function save(showToast=true){
  const it=QUESTIONS[idx];
  const existingIndex = caps.findIndex(c=>c.q===it.q);
  const next = {
    q: it.q, stage: it.stage, idx,
    note: $('#note').value.trim(),
    track: $('#track').value.trim(),
    place: $('#place').value.trim(),
    ts: Date.now()
  };
  if(existingIndex>=0) caps[existingIndex]=next; else caps.push(next);
  localStorage.setItem(K_CAP, JSON.stringify(caps));
  if(showToast) toast('저장했어요.');
  $('#saveHint').textContent='자동저장됨';
}

function bind(){
  $('#btnNext').addEventListener('click', ()=>{ save(); if(idx<QUESTIONS.length-1){ idx++; render(); } });
  $('#btnPrev').addEventListener('click', ()=>{ save(false); if(idx>0){ idx--; render(); } });
  $('#btnSkip').addEventListener('click', ()=>{ if(idx<QUESTIONS.length-1){ idx++; render(); } });
  $('#btnPhoto').addEventListener('click', ()=> $('#filePhoto').click());
  $('#filePhoto').addEventListener('change', async e=>{ const f=e.target.files[0]; if(!f) return; const data=await readFileAsDataURL(f); toast('사진 첨부됨'); });
  $('#btnAudio').addEventListener('click', ()=>{ toast('3초 음성(모의)'); });
  // autosave on input blur
  ['note','track','place'].forEach(id=> $('#'+id).addEventListener('blur', ()=>save(false)));
  window.addEventListener('beforeunload', ()=>save(false));
}

document.addEventListener('DOMContentLoaded', ()=>{ render(); bind(); });
