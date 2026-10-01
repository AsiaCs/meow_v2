// SAT Reading & Writing Ladder. Ported from the standalone ladder page: it renders
// straight into a DOM node with template strings rather than React, so the
// question, timer and highlighter logic stays identical to the original.
// mountLadder() returns a cleanup function that removes every global listener.

const BANK = "sat-bank" // private storage bucket: qs.json + figs/*.png

export function mountLadder($app, opts) {
const cleanups = [];

const LEVELS = ["Easy","Medium","Hard"];
const BENCH_N = 27, MODULE_SEC = 32*60, PASS = 0.9, TARGET_SEC = 71;
const DOMAINS = [
  ["Craft and Structure",["Words in Context","Text Structure and Purpose","Cross-Text Connections"]],
  ["Information and Ideas",["Central Ideas and Details","Command of Evidence","Inferences"]],
  ["Standard English Conventions",["Boundaries","Form, Structure, and Sense"]],
  ["Expression of Ideas",["Transitions","Rhetorical Synthesis"]],
];
const SKILLS = DOMAINS.flatMap(d => d[1]);
// questions per skill in one 27-question module (Craft 7, Info 7, Conventions 7, Expression 6)
const MODULE_MIX = {"Words in Context":4,"Text Structure and Purpose":2,"Cross-Text Connections":1,"Central Ideas and Details":2,"Command of Evidence":3,"Inferences":2,"Boundaries":4,"Form, Structure, and Sense":3,"Transitions":3,"Rhetorical Synthesis":3};
function needFor(n){ return Math.ceil(n*PASS - 1e-9); }
const LS_KEY = "satrw-ladder-v1";
let Q = [], byId = {};
let S = blank();
const sb = opts.supabase, me = opts.user;
let syncMsg = "Saved on this device";
let figUrls = {};
const figSrc = f => figUrls[f] || "";
let view = {name:"home", level:null};
let run = null; // active drill/benchmark
let tick = null;

function blank(){ return {v:1, updatedAt:0, attempts:{}, bench:[]}; }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];} return a; }
function pct(n,d){ return d? Math.round(100*n/d) : null; }
function fmtT(s){ return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }

/* ---------- persistence ---------- */
// Each student's progress lives in their own row of the `progress` table (row-level security
// lets a student read and write only their own row). localStorage is a per-device backup.
function lsKey(){ return LS_KEY + ":" + (me ? me.id : "anon"); }
function loadLocal(){ try{ const r = localStorage.getItem(lsKey()); if(r){ const o = JSON.parse(r); if(o && o.attempts) S = o; } }catch(e){} }
let saveT = null;
function save(){
  S.updatedAt = Date.now();
  try{ localStorage.setItem(lsKey(), JSON.stringify(S)); }catch(e){}
  clearTimeout(saveT);
  saveT = setTimeout(pushRemote, 600);
}
function showSync(){ const el = document.getElementById("sync"); if(el) el.textContent = syncMsg; }
async function pushRemote(){
  if(!sb || !me) return;
  const {error} = await sb.from("sat_progress").upsert({user_id: me.id, data: S, updated_at: new Date().toISOString()});
  syncMsg = error ? "Saved on this device (account sync failed)" : "Saved to your account";
  showSync();
}
async function pullRemote(){
  const {data, error} = await sb.from("sat_progress").select("data").eq("user_id", me.id).maybeSingle();
  if(error){ syncMsg = "Saved on this device (account sync failed)"; return; }
  const remote = data && data.data;
  if(remote && remote.attempts && (remote.updatedAt||0) > (S.updatedAt||0)){
    S = remote;
    try{ localStorage.setItem(lsKey(), JSON.stringify(S)); }catch(e){}
  } else if(Object.keys(S.attempts).length || S.bench.length){ await pushRemote(); }
  syncMsg = "Saved to your account";
}

/* ---------- stats ---------- */
function retiredSet(){ return new Set(S.bench.filter(b=>b.passed).flatMap(b=>b.ids)); }
function passed(level){ return S.bench.some(b => b.level === level && b.passed); }
function unlocked(level){ const i = LEVELS.indexOf(level); return i === 0 || passed(LEVELS[i-1]); }
function currentLevel(){ for(const l of LEVELS) if(!passed(l)) return l; return "Hard"; }
function levelStats(level, skill){
  let seen=0, right=0, total=0, recentR=0, recentN=0;
  const ret = retiredSet();
  const pool = Q.filter(q => q.diff===level && (!skill || q.skill===skill));
  const retired = pool.filter(q => ret.has(q.id)).length;
  const recent = [];
  for(const q of pool){ const a = S.attempts[q.id]; if(a){ seen++; right += a.r; total += a.n; recent.push(a); } }
  recent.sort((x,y)=>y.t-x.t).slice(0,30).forEach(a => { recentN++; recentR += a.last; });
  return {count: pool.length, retired, live: pool.length-retired, seen, right, total, acc: pct(right,total), recent: pct(recentR,recentN), recentN};
}
function bestBench(level){ const b = S.bench.filter(x=>x.level===level); return b.length ? Math.max(...b.map(x=>x.score/x.n)) : null; }

/* ---------- selection ---------- */
function pickDrill(level, skill){
  const ret = retiredSet();
  let pool = Q.filter(q => q.diff===level && (!skill || q.skill===skill) && !ret.has(q.id));
  if(!pool.length) pool = Q.filter(q => q.diff===level && (!skill || q.skill===skill));
  const recentIds = new Set(run ? run.history.slice(-15).map(h=>h.id) : []);
  const fresh = pool.filter(q => !S.attempts[q.id] && !recentIds.has(q.id));
  const missed = pool.filter(q => S.attempts[q.id] && !S.attempts[q.id].last && !recentIds.has(q.id));
  let src;
  if(missed.length && (Math.random() < 0.35 || !fresh.length)) src = missed;
  else if(fresh.length) src = fresh;
  else src = pool.filter(q => !recentIds.has(q.id));
  if(!src.length) src = pool;
  // weight toward weak skills when drilling the whole level
  if(!skill && src.length > 12){
    const w = src.map(q => { const st = levelStats(level, q.skill); return st.acc==null ? 1.2 : 1.6 - st.acc/100; });
    let r = Math.random()*w.reduce((a,b)=>a+b,0);
    for(let i=0;i<src.length;i++){ r -= w[i]; if(r<=0) return src[i]; }
  }
  return src[Math.random()*src.length|0];
}
function pickBench(level){
  const ret = retiredSet();
  const used = new Set(S.bench.filter(b=>b.level===level).flatMap(b=>b.ids));
  const rank = q => (used.has(q.id)?2:0) + (S.attempts[q.id]?1:0);
  const pools = {};
  SKILLS.forEach(s => pools[s] = shuffle(Q.filter(q => q.diff===level && q.skill===s && !ret.has(q.id))).sort((a,b)=>rank(a)-rank(b)));
  const out = []; let short = 0;
  SKILLS.forEach(s => { const take = pools[s].splice(0, MODULE_MIX[s]); out.push(...take); short += MODULE_MIX[s]-take.length; });
  // a skill that has run out of fresh questions hands its slots to the others
  const rest = SKILLS.flatMap(s => pools[s]).sort((a,b)=>rank(a)-rank(b) || Math.random()-.5);
  out.push(...rest.slice(0, short));
  const order = q => SKILLS.indexOf(q.skill);
  return shuffle(out).sort((a,b)=>order(a)-order(b));
}

/* ---------- recording ---------- */
function record(q, choice, secs){
  const ok = choice === q.answer ? 1 : 0;
  const a = S.attempts[q.id] || {n:0, r:0, last:0, t:0, s:0};
  a.n++; a.r += ok; a.last = ok; a.t = Date.now(); a.s = secs; a.pick = choice;
  S.attempts[q.id] = a;
  return ok;
}

/* ---------- views ---------- */
function render(){
  clearInterval(tick); hidePop();
  if(view.name === "home") return renderHome();
  if(view.name === "quiz") return renderQuiz();
  if(view.name === "result") return renderResult();
}

function renderHome(){
  const cur = currentLevel();
  const sel = view.level || cur;
  const allPassed = LEVELS.every(passed);
  let h = `<div class="top"><div><h1>SAT Reading &amp; Writing Ladder</h1>
    <p>${allPassed ? "All three levels cleared. Keep Hard sharp with mixed drills." : `Working level: <b>${cur}</b>. Each module is 27 questions in 32 minutes, like the real test. Score 90% or better (25/27) to climb.`}</p></div>
    <div class="sync" id="sync">${esc(syncMsg)}</div></div>`;
  h += `<div class="ladder">`;
  for(const l of LEVELS){
    const st = levelStats(l), ok = passed(l), un = unlocked(l), best = bestBench(l);
    const pill = ok ? `<span class="pill pass">Passed</span>` : un ? `<span class="pill cur">Current</span>` : `<span class="pill lock">Locked</span>`;
    const recentTxt = st.recent==null ? "—" : st.recent+"%";
    h += `<div class="rung ${un?"":"locked"}">
      <div class="row"><h2>${l}</h2>${pill}</div>
      <div class="stat">
        <div><b>${st.seen}<span class="mono" style="font-size:13px;color:var(--muted)">/${st.count}</span></b><span>questions seen</span></div>
        <div><b>${recentTxt}</b><span>last 30 accuracy</span></div>
        <div><b>${best==null?"—":Math.round(best*100)+"%"}</b><span>best module</span></div>
        <div><b>${st.retired}</b><span>retired</span></div>
      </div>
      <div class="meter" title="Last-30 accuracy vs the 90% bar"><i style="width:${st.recent||0}%"></i><span class="goal"></span></div>
      <div class="acts">
        ${un ? `<button class="btn" data-drill="${l}">Drill</button><button class="btn ${ok?"":"primary"}" data-bench="${l}">${ok?"New module":"Start module"}</button>` : `<span class="rule" style="margin:0">Unlocks after passing a ${LEVELS[LEVELS.indexOf(l)-1]} module.</span>`}
      </div></div>`;
  }
  h += `</div>`;
  h += `<p class="rule">A module follows the real test's order: Craft and Structure, then Information and Ideas, then Standard English Conventions, then Expression of Ideas. No feedback until you submit, and it auto-submits when the clock runs out. Pass a module and its 27 questions are retired: they never appear in a module or a drill again. Fail it and those questions stay in circulation, but the next module pulls ones you haven't seen first.</p>`;

  // skills table
  h += `<div class="section"><div class="section-h"><h3>By skill</h3><div class="tabs" role="group" aria-label="Level">${LEVELS.map(l=>`<button data-tab="${l}" aria-pressed="${l===sel}">${l}</button>`).join("")}</div></div><div class="skills">`;
  for(const [dom, sks] of DOMAINS){
    h += `<div class="dom label">${dom}</div>`;
    for(const s of sks){
      const st = levelStats(sel, s);
      const a = st.acc; const cls = a==null?"":a>=90?"hi":a>=70?"mid":"lo";
      h += `<div class="sk"><div class="nm">${s}</div>
        <div class="meter"><i class="${cls}" style="width:${a||0}%"></i><span class="goal"></span></div>
        <div class="pct">${a==null?"—":a+"%"}</div>
        <div class="ct mono">${st.seen}/${st.count}</div>
        <div>${unlocked(sel)?`<button class="btn ghost" data-drill="${sel}" data-skill="${esc(s)}">Drill →</button>`:""}</div></div>`;
    }
  }
  h += `</div></div>`;

  // history
  const hist = S.bench.map((b,i)=>({...b, bi:i})).reverse();
  h += `<div class="section"><div class="section-h"><h3>Module history</h3></div><div class="hist">`;
  if(!hist.length) h += `<div class="empty">No modules yet. Start with an Easy module to get a baseline.</div>`;
  else h += `<table><thead><tr><th>Date</th><th>Level</th><th>Score</th><th>Result</th><th>Time</th><th></th></tr></thead><tbody>${hist.map(b=>`<tr class="hrow" data-bi="${b.bi}" tabindex="0"><td>${new Date(b.ts).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</td><td>${b.level}</td><td class="mono">${b.score}/${b.n} (${pct(b.score,b.n)}%)</td><td style="color:var(--${b.passed?"ok":"bad"})">${b.passed?"Passed · retired":"Below 90%"}${b.timedOut?" · time ran out":""}</td><td class="mono">${fmtT(b.secs||0)}</td><td class="go">${b.n-b.score ? `Review ${b.n-b.score} missed →` : "Review →"}</td></tr>`).join("")}</tbody></table>`;
  h += `</div></div>`;
  h += `<div class="section" id="resetZone"><button class="btn ghost" id="resetBtn">Reset all progress</button></div>`;
  $app.innerHTML = h;

  $app.querySelectorAll("[data-bi]").forEach(r => { const open = () => { view = {name:"result", b:S.bench[+r.dataset.bi], review:null, past:true, onlyWrong: S.bench[+r.dataset.bi].score < S.bench[+r.dataset.bi].n}; render(); window.scrollTo(0,0); };
    r.onclick = open; r.onkeydown = e => { if(e.key==="Enter"){ e.preventDefault(); open(); } }; });
  $app.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { view.level = b.dataset.tab; render(); });
  $app.querySelectorAll("[data-drill]").forEach(b => b.onclick = () => startDrill(b.dataset.drill, b.dataset.skill || null));
  $app.querySelectorAll("[data-bench]").forEach(b => b.onclick = () => startBench(b.dataset.bench));
  document.getElementById("resetBtn").onclick = () => {
    document.getElementById("resetZone").innerHTML = `<div class="confirm">Erase every answer and module, and un-retire all questions? This can't be undone. <button class="btn" id="rsYes">Erase</button><button class="btn ghost" id="rsNo">Cancel</button></div>`;
    document.getElementById("rsYes").onclick = () => { S = blank(); save(); render(); };
    document.getElementById("rsNo").onclick = render;
  };
}

function startDrill(level, skill){
  run = {mode:"drill", level, skill, history:[], right:0, q:null, picked:null, revealed:false, struck:new Set(), start:Date.now()};
  run.q = pickDrill(level, skill);
  view = {name:"quiz"}; render(); window.scrollTo(0,0);
}
function startBench(level){
  const qs = pickBench(level);
  if(qs.length < 5){ view={name:"home"}; render(); return; }
  run = {mode:"bench", level, list:qs, idx:0, answers:{}, times:{}, flags:new Set(), struck:new Set(), start:Date.now(), qStart:Date.now(), limit: Math.round(MODULE_SEC*qs.length/BENCH_N)};
  view = {name:"quiz"}; render(); window.scrollTo(0,0);
}

function renderQuiz(){
  clearInterval(tick);
  const bench = run.mode === "bench";
  const q = bench ? run.list[run.idx] : run.q;
  if(!run.qStart) run.qStart = Date.now();
  const picked = bench ? run.answers[q.id] : run.picked;
  const revealed = !bench && run.revealed;
  const n = run.history ? run.history.length : 0;

  let top = `<div class="qbar"><div class="l"><button class="btn ghost" id="exit">← ${bench?"Quit module":"Done"}</button>
    <span class="mode">${bench ? run.level+" module" : run.level+" drill"}${run.skill?" · "+esc(run.skill):""}</span>`;
  if(bench) top += `<span class="tally mono">${run.idx+1} / ${run.list.length}</span>`;
  else top += `<span class="tally">${n ? `${run.right}/${n} correct this session (${pct(run.right,n)}%)` : "Session starts now"}</span>`;
  top += `</div><span class="timer" id="timer">0:00</span></div>`;
  if(bench) top += `<div class="nav" aria-label="Question navigator">${run.list.map((x,i)=>`<button data-go="${i}" class="${i===run.idx?"cur":""} ${run.answers[x.id]?"a":""} ${run.flags.has(x.id)?"f":""}" aria-label="Question ${i+1}">${i+1}</button>`).join("")}</div>`;

  run.hl = run.hl || {};
  const saved = run.hl[q.id] || {};
  const passage = saved.pass || ((q.fig ? `<img src="${figSrc(q.fig)}" alt="Figure for question ${q.id}">` : "") + q.passage.map(p=>`<p>${p}</p>`).join(""));
  const choices = q.choices.map((c,i) => {
    const L = "ABCD"[i];
    let cls = "";
    if(revealed){ if(L===q.answer) cls="right"; else if(L===picked) cls="wrong"; }
    else if(L===picked) cls="sel";
    const struck = run.struck.has(L) && !revealed;
    return `<div class="crow ${struck?"struck":""}"><button class="choice ${cls}" data-c="${L}" ${revealed?"disabled":""}><span class="ltr">${L}</span><span class="txt">${c}</span></button>${revealed?"":`<button class="strike" data-x="${L}" title="Cross out ${L}" aria-label="Cross out ${L}">${struck?"↺":"✕"}</button>`}</div>`;
  }).join("");

  let act = "";
  if(bench){
    act = `<div class="qact"><button class="btn" id="prev" ${run.idx===0?"disabled":""}>Back</button>
      ${run.idx < run.list.length-1 ? `<button class="btn primary" id="next">Next</button>` : `<button class="btn primary" id="finish">Submit module</button>`}
      <button class="btn ghost flag ${run.flags.has(q.id)?"on":""}" id="flag">${run.flags.has(q.id)?"⚑ Marked for review":"⚐ Mark for review"}</button></div>
      <span class="keys">A–D to answer, ←/→ to move. You can jump to any question with the numbers above.</span>`;
    const unanswered = run.list.filter(x=>!run.answers[x.id]).length;
    if(run.idx === run.list.length-1 && unanswered) act += `<div class="keys">${unanswered} unanswered. Unanswered questions count as wrong.</div>`;
  } else if(!revealed){
    act = `<div class="qact"><button class="btn primary" id="check" ${picked?"":"disabled"}>Check answer</button><button class="btn ghost" id="skip">Skip</button><span class="keys">A–D to pick, Enter to check</span></div>`;
  } else {
    const ok = picked === q.answer;
    act = `<div class="qact"><span class="verdict ${ok?"ok":"no"}">${ok?"Correct":"Incorrect. Answer: "+q.answer}</span><button class="btn primary" id="nextq">Next question</button><span class="keys">Enter for next</span></div>
      ${explainBlock(q, picked)}`;
  }

  hidePop();
  $app.innerHTML = top + `<div class="qgrid"><div class="pass"><div class="hlable" data-hl="pass">${passage}</div><div class="hlhint">Select text to highlight or underline it. Click a highlight to change or remove it.</div></div>
    <div class="ans"><div class="meta"><span class="tag">${esc(q.skill)}</span><span class="tag">${q.diff}</span><span class="tag mono">${q.id}</span></div>
    <p class="prompt hlable" data-hl="prompt">${saved.prompt || q.prompt}</p><div class="choices">${choices}</div>${act}</div></div>`;

  if(revealed) fillSimple(q, picked);
  // timer
  const tEl = document.getElementById("timer");
  const upd = bench ? () => {
      if(!run) return;
      const left = run.limit - Math.floor((Date.now()-run.start)/1000);
      if(left <= 0){ clearInterval(tick); finishBench(true); return; }
      tEl.textContent = fmtT(left) + " left"; tEl.classList.toggle("over", left <= 300);
    } : () => { const s = Math.round(((revealed ? run.frozen : Date.now()) - run.qStart)/1000); tEl.textContent = fmtT(s); tEl.classList.toggle("over", s > TARGET_SEC); };
  upd(); if(!revealed) tick = setInterval(upd, 1000);

  document.getElementById("exit").onclick = () => { if(bench && !confirmQuit()) return; run = null; view = {name:"home"}; render(); };
  $app.querySelectorAll("[data-c]").forEach(b => b.onclick = () => choose(b.dataset.c));
  $app.querySelectorAll("[data-x]").forEach(b => b.onclick = () => { const L=b.dataset.x; run.struck.has(L)?run.struck.delete(L):run.struck.add(L); if(run.picked===L) run.picked=null; if(bench && run.answers[q.id]===L) delete run.answers[q.id]; renderQuiz(); });
  const on = (id,f) => { const e=document.getElementById(id); if(e) e.onclick=f; };
  on("check", check); on("skip", nextDrill); on("nextq", nextDrill);
  on("prev", () => moveBench(-1)); on("next", () => moveBench(1)); on("finish", () => finishBench(false));
  on("flag", () => { run.flags.has(q.id) ? run.flags.delete(q.id) : run.flags.add(q.id); renderQuiz(); });
  $app.querySelectorAll("[data-go]").forEach(b => b.onclick = () => moveBench(+b.dataset.go - run.idx));
}
let quitArmed = false;
function confirmQuit(){
  if(quitArmed){ quitArmed=false; return true; }
  quitArmed = true; const b = document.getElementById("exit"); b.textContent = "Click again to discard this module"; b.style.color="var(--bad)";
  setTimeout(()=>{quitArmed=false;},4000); return false;
}
function choose(L){
  if(run.mode==="bench"){ const q=run.list[run.idx]; run.answers[q.id]=L; run.struck.delete(L); }
  else { if(run.revealed) return; run.picked=L; run.struck.delete(L); }
  renderQuiz();
}
function check(){
  if(!run.picked || run.revealed) return;
  const q = run.q, secs = Math.round((Date.now()-run.qStart)/1000);
  run.frozen = Date.now();
  const ok = record(q, run.picked, secs);
  run.right += ok; run.history.push({id:q.id, ok}); run.revealed = true;
  save(); renderQuiz();
}
function nextDrill(){
  run.q = pickDrill(run.level, run.skill); run.picked=null; run.revealed=false; run.struck=new Set(); run.qStart=Date.now();
  renderQuiz(); window.scrollTo(0,0);
}
function moveBench(d){
  const q = run.list[run.idx];
  run.times[q.id] = (run.times[q.id]||0) + Math.round((Date.now()-run.qStart)/1000);
  run.idx = Math.max(0, Math.min(run.list.length-1, run.idx+d));
  run.struck = new Set(); run.qStart = Date.now(); renderQuiz(); window.scrollTo(0,0);
}
function finishBench(timedOut){
  if(!run || run.mode!=="bench") return;
  const q = run.list[run.idx];
  run.times[q.id] = (run.times[q.id]||0) + Math.round((Date.now()-run.qStart)/1000);
  let score = 0;
  for(const x of run.list){ score += record(x, run.answers[x.id]||"-", run.times[x.id]||0); }
  const n = run.list.length, secs = Math.min(run.limit, Math.round((Date.now()-run.start)/1000));
  const b = {level:run.level, ts:Date.now(), score, n, passed: score >= needFor(n), secs, timedOut: !!timedOut, ids: run.list.map(x=>x.id), picks: run.list.map(x=>run.answers[x.id]||"-")};
  S.bench.push(b); save();
  run = null; view = {name:"result", b, review:null, onlyWrong: b.score < b.n}; render(); window.scrollTo(0,0);
}

function reviewIdx(b){
  const all = b.ids.map((_,i)=>i);
  if(!view.onlyWrong) return all;
  const wrong = all.filter(i => b.picks[i] !== byId[b.ids[i]].answer);
  return wrong.length ? wrong : all;
}
function renderResult(){
  const b = view.b;
  if(view.review != null){
    const q = byId[b.ids[view.review]], pick = b.picks[view.review];
    const rIdx = reviewIdx(b), pos = rIdx.indexOf(view.review);
    const choices = q.choices.map((c,i)=>{const L="ABCD"[i]; const cls = L===q.answer?"right":L===pick?"wrong":""; return `<div class="crow"><button class="choice ${cls}" disabled><span class="ltr">${L}</span><span class="txt">${c}</span></button></div>`;}).join("");
    $app.innerHTML = `<div class="qbar"><div class="l"><button class="btn ghost" id="back">← Results</button><span class="mode">Question ${view.review+1} of ${b.n}</span>${view.onlyWrong?`<span class="tally">Missed ${rIdx.indexOf(view.review)+1} of ${rIdx.length}</span>`:""}</div>
      <div class="l"><button class="btn" id="rp" ${pos<=0?"disabled":""}>Back</button><button class="btn" id="rn" ${pos>=rIdx.length-1?"disabled":""}>Next</button></div></div>
      <div class="qgrid"><div class="pass">${(q.fig?`<img src="${figSrc(q.fig)}" alt="Figure">`:"")+q.passage.map(p=>`<p>${p}</p>`).join("")}</div>
      <div class="ans"><div class="meta"><span class="tag">${esc(q.skill)}</span><span class="tag">${q.diff}</span></div><p class="prompt">${q.prompt}</p><div class="choices">${choices}</div>
      <span class="verdict ${pick===q.answer?"ok":"no"}">${pick===q.answer?"Correct":pick==="-"?"Left blank. Answer: "+q.answer:"You chose "+pick+". Answer: "+q.answer}</span>
      ${explainBlock(q, pick)}</div></div>`;
    fillSimple(q, pick);
    document.getElementById("back").onclick = () => { view.review=null; render(); };
    document.getElementById("rp").onclick = () => { view.review = rIdx[pos-1]; render(); window.scrollTo(0,0); };
    document.getElementById("rn").onclick = () => { view.review = rIdx[pos+1]; render(); window.scrollTo(0,0); };
    return;
  }
  const next = LEVELS[LEVELS.indexOf(b.level)+1];
  const need = needFor(b.n);
  const missBySkill = {};
  b.ids.forEach((id,i)=>{ const q=byId[id]; if(b.picks[i]!==q.answer) missBySkill[q.skill]=(missBySkill[q.skill]||0)+1; });
  const weak = Object.entries(missBySkill).sort((a,c)=>c[1]-a[1]);
  let msg;
  const left = levelStats(b.level).live;
  if(b.passed) msg = `These ${b.n} questions are retired. ${next ? next+" is unlocked. " : "You cleared a Hard module. Hard-level accuracy above 90% is where 750+ scores live. "}${left} ${b.level} questions remain in rotation.`;
  else msg = `You needed ${need}/${b.n}. Drill the skills below, then start a new module. It will pull questions you haven't seen first.`;
  if(b.timedOut) msg = "Time ran out, so unanswered questions counted as wrong. " + msg;
  if(view.past) msg = b.passed ? `Passed. These ${b.n} questions are retired from modules and drills.` : `Below the bar: ${need}/${b.n} was needed.${b.timedOut?" Time ran out on this one.":""}`;
  $app.innerHTML = `<div class="result">
    <div class="label">${view.past ? new Date(b.ts).toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"})+" · " : ""}${b.level} module · ${fmtT(b.secs)} total · ${fmtT(Math.round(b.secs/b.n))} per question</div>
    <div class="score"><b class="mono">${b.score}/${b.n}</b><span class="v ${b.passed?"ok":"no"}">${pct(b.score,b.n)}% · ${b.passed?"Passed":"Below 90%"}</span></div>
    <p style="margin:0">${msg}</p>
    ${weak.length?`<div><div class="label" style="margin-bottom:8px">Misses by skill</div><div class="meta">${weak.map(([s,c])=>`<button class="btn" data-drill="${b.level}" data-skill="${esc(s)}">${esc(s)} · ${c} missed</button>`).join("")}</div></div>`:""}
    <div><div class="rhead"><div class="label">Review questions</div>${b.score<b.n?`<div class="tabs" role="group" aria-label="Filter"><button data-f="wrong" aria-pressed="${!!view.onlyWrong}">Missed (${b.n-b.score})</button><button data-f="all" aria-pressed="${!view.onlyWrong}">All ${b.n}</button></div>`:""}</div>
    <div class="rlist">${reviewIdx(b).map(i=>{const id=b.ids[i]; const q=byId[id]; const ok=b.picks[i]===q.answer; const snip=(q.passage.join(" ").replace(/<br>/g," ").replace(/<[^>]+>/g,"")||q.prompt.replace(/<[^>]+>/g,"")).replace(/&amp;/g,"&").slice(0,110); return `<button class="ritem" data-r="${i}"><span class="mk ${ok?"ok":"no"}">${ok?"✓":"✕"}</span><span class="s"><span class="qn">${i+1}</span> ${esc(q.skill)} · ${esc(snip)}…</span><span class="mono" style="color:var(--muted)">${ok?q.answer:(b.picks[i]==="-"?"–":b.picks[i])+"→"+q.answer}</span></button>`}).join("")}</div></div>
    <div class="qact"><button class="btn primary" id="home">Back to ladder</button>${next&&b.passed?`<button class="btn" data-drill="${next}">Start ${next} drill</button>`:""}</div></div>`;
  document.getElementById("home").onclick = () => { view={name:"home"}; render(); };
  $app.querySelectorAll("[data-f]").forEach(e => e.onclick = () => { view.onlyWrong = e.dataset.f==="wrong"; render(); });
  $app.querySelectorAll("[data-r]").forEach(e => e.onclick = () => { view.review = +e.dataset.r; render(); window.scrollTo(0,0); });
  $app.querySelectorAll("[data-drill]").forEach(e => e.onclick = () => startDrill(e.dataset.drill, e.dataset.skill||null));
}

/* ---------- simple explanations ---------- */
const simpleCache = {};
function explainBlock(q, pick){
  return `<div class="simple" id="simple" data-q="${q.id}"><p class="wait">Writing a simple explanation…</p></div>
    <details class="cb"><summary>Full College Board explanation</summary><div class="rat">${q.rationale.map(p=>`<p>${p}</p>`).join("")}</div></details>`;
}
function simpleHTML(q, pick, x){
  const wrong = pick && pick !== "-" && pick !== q.answer ? pick : null;
  const others = "ABCD".split("").filter(L => L !== q.answer && L !== wrong && x.traps[L]);
  let h = x.rule ? `<span class="rule">${esc(x.rule)}</span>` : "";
  h += `<div><p class="h">Answer ${q.answer}</p><p>${esc(x.why)}</p></div>`;
  if(wrong && x.traps[wrong]) h += `<div class="mine"><p class="h">Why ${wrong} (your pick) is wrong</p><p>${esc(x.traps[wrong])}</p></div>`;
  if(others.length) h += `<div><p class="h">${wrong ? "The other wrong choices" : "Why the others are wrong"}</p><ul>${others.map(L=>`<li><b>${L}</b><span>${esc(x.traps[L])}</span></li>`).join("")}</ul></div>`;
  if(x.next && x.next.length) h += `<div><p class="h">Next time</p><ol>${x.next.map(n=>`<li>${esc(n)}</li>`).join("")}</ol></div>`;
  return h;
}
function validSimple(x, q){
  return x && typeof x.why === "string" && x.traps && typeof x.traps === "object" && Array.isArray(x.next)
    && "ABCD".split("").filter(L=>L!==q.answer).every(L => typeof x.traps[L] === "string");
}
async function getSimple(q){
  if(q.simple) return q.simple;
  if(simpleCache[q.id]) return simpleCache[q.id];
  // Explanations are shared: once any student's view writes one, everyone reads the saved copy.
  const {data} = await sb.from("sat_explanations").select("data").eq("qid", q.id).maybeSingle();
  if(data && validSimple(data.data, q)){ simpleCache[q.id] = data.data; return data.data; }
  const res = await fetch("/api/sat/explain", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({qid: q.id})});
  if(res.status === 503) return null; // explanations not switched on (no API key)
  if(!res.ok) throw {code: res.status === 429 ? "rate_limited" : "failed"};
  const x = await res.json();
  if(!validSimple(x, q)) throw {code: "bad_shape"};
  simpleCache[q.id] = x;
  return x;
}
async function fillSimple(q, pick){
  const el = document.getElementById("simple");
  if(!el) return;
  try{
    const x = await getSimple(q);
    const cur = document.getElementById("simple");
    if(!cur || cur.dataset.q !== q.id) return;
    if(!x){ cur.innerHTML = `<p class="wait">There's no simple explanation for this question yet. The full explanation is below.</p>`; cur.nextElementSibling.open = true; return; }
    cur.innerHTML = simpleHTML(q, pick, x);
  }catch(e){
    const cur = document.getElementById("simple");
    if(!cur || cur.dataset.q !== q.id) return;
    const msg = e && e.code === "rate_limited" ? "Too many requests at once. Move to another question and come back in a minute." : "Couldn't write the simple version this time. The full explanation is below.";
    cur.innerHTML = `<p class="wait">${msg}</p>`; cur.nextElementSibling.open = true;
  }
}

/* ---------- highlighter ---------- */
const pop = document.createElement("div"); pop.id = "hlpop"; pop.hidden = true;
pop.innerHTML = `<button class="sw y" data-hc="y" aria-label="Yellow highlight"></button><button class="sw b" data-hc="b" aria-label="Blue highlight"></button><button class="sw p" data-hc="p" aria-label="Pink highlight"></button><button class="u" data-hc="u" aria-label="Underline">U</button><button class="rm" data-hc="rm">Remove</button>`;
document.body.appendChild(pop);
const listen = (t, ev, fn) => { t.addEventListener(ev, fn); cleanups.push(() => t.removeEventListener(ev, fn)); };
let popRange = null, popMark = null;
function hidePop(){ pop.hidden = true; popRange = null; popMark = null; }
function hlRoot(node){ const el = node && (node.nodeType===1 ? node : node.parentElement); return el ? el.closest(".hlable") : null; }
function showPop(rect, withRemove){
  pop.querySelector(".rm").hidden = !withRemove;
  pop.hidden = false;
  const w = pop.offsetWidth, x = Math.min(Math.max(8, rect.left + rect.width/2 - w/2 + scrollX), scrollX + document.documentElement.clientWidth - w - 8);
  let y = rect.top + scrollY - pop.offsetHeight - 8;
  if(y < scrollY + 4) y = rect.bottom + scrollY + 8;
  pop.style.left = x + "px"; pop.style.top = y + "px";
}
function saveHl(){
  if(!run) return;
  const q = run.mode==="bench" ? run.list[run.idx] : run.q;
  const p = $app.querySelector('[data-hl="pass"]'), pr = $app.querySelector('[data-hl="prompt"]');
  run.hl[q.id] = {pass: p ? p.innerHTML : undefined, prompt: pr ? pr.innerHTML : undefined};
}
function wrapRange(range, cls){
  const root = hlRoot(range.commonAncestorContainer); if(!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: n => range.intersectsNode(n) && n.nodeValue.trim() ? 1 : 2});
  const nodes = []; while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(n => {
    let start = n === range.startContainer ? range.startOffset : 0;
    let end = n === range.endContainer ? range.endOffset : n.nodeValue.length;
    if(end <= start) return;
    const old = n.parentElement.closest("mark.hl");
    if(old){ old.className = "hl " + cls; return; }
    if(end < n.nodeValue.length) n.splitText(end);
    const t = start > 0 ? n.splitText(start) : n;
    const m = document.createElement("mark"); m.className = "hl " + cls;
    t.parentNode.insertBefore(m, t); m.appendChild(t);
  });
}
function unwrap(m){ const p = m.parentNode; while(m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); }
function onSelectEnd(){
  setTimeout(() => {
    if(view.name!=="quiz") return;
    const sel = getSelection();
    if(!sel || sel.isCollapsed || !sel.rangeCount) return;
    const r = sel.getRangeAt(0);
    if(!hlRoot(r.startContainer) || hlRoot(r.startContainer) !== hlRoot(r.endContainer)) return;
    popRange = r.cloneRange(); popMark = null;
    showPop(r.getBoundingClientRect(), false);
  }, 10);
}
listen(document, "mouseup", e => { if(!pop.contains(e.target)) onSelectEnd(); });
listen(document, "touchend", e => { if(!pop.contains(e.target)) onSelectEnd(); });
listen(document, "click", e => {
  if(pop.contains(e.target)) return;
  const m = e.target.closest && e.target.closest("mark.hl");
  const sel = getSelection();
  if(m && sel && sel.isCollapsed && hlRoot(m)){ popMark = m; popRange = null; showPop(m.getBoundingClientRect(), true); return; }
  if(!sel || sel.isCollapsed) hidePop();
});
pop.addEventListener("mousedown", e => e.preventDefault());
pop.addEventListener("click", e => {
  const b = e.target.closest("[data-hc]"); if(!b) return;
  const c = b.dataset.hc;
  if(popMark){ c==="rm" ? unwrap(popMark) : (popMark.className = "hl " + c); }
  else if(popRange && c!=="rm"){ wrapRange(popRange, c); }
  getSelection().removeAllRanges(); saveHl(); hidePop();
});
listen(window, "resize", hidePop);

listen(document, "keydown", e => {
  if(view.name !== "quiz" || !run || e.metaKey || (e.target && e.target.closest && e.target.closest("input,textarea,select,[contenteditable]")) || !document.body.contains($app) || e.ctrlKey || e.altKey) return;
  const k = e.key.toUpperCase();
  if("ABCD".includes(k) && k.length===1){ choose(k); e.preventDefault(); return; }
  if(run.mode==="drill" && e.key==="Enter"){ e.preventDefault(); run.revealed ? nextDrill() : check(); }
  if(run.mode==="bench"){ if(e.key==="ArrowRight" && run.idx<run.list.length-1) moveBench(1); if(e.key==="ArrowLeft" && run.idx>0) moveBench(-1); }
});


/* ---------- boot ---------- */
let alive = true;
cleanups.push(() => { alive = false; clearInterval(tick); clearTimeout(saveT); pop.remove(); });
(async () => {
  $app.innerHTML = `<div class="loading">Loading question bank…</div>`;
  loadLocal();
  const {data: blob, error} = await sb.storage.from(BANK).download("qs.json");
  if(!alive) return;
  if(error || !blob){ $app.innerHTML = `<div class="loading">The question bank didn't load. Refresh the page to try again.</div>`; return; }
  try{ Q = JSON.parse(await blob.text()); }
  catch(e){ $app.innerHTML = `<div class="loading">The question bank didn't load. Refresh the page to try again.</div>`; return; }
  Q.forEach(q => byId[q.id] = q);
  // Figures live in the same private bucket; signed links last 12 hours.
  const figs = [...new Set(Q.filter(q => q.fig).map(q => q.fig))];
  if(figs.length){
    const {data: signed} = await sb.storage.from(BANK).createSignedUrls(figs, 12*3600);
    (signed || []).forEach(s => { if(s.signedUrl) figUrls[s.path] = s.signedUrl; });
  }
  await pullRemote();
  if(alive) render();
})();
return () => cleanups.forEach(f => f());
}
