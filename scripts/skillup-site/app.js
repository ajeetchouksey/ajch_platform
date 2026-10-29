/* SkillUp app runtime — inlined into the page by build.mjs, which first defines window.SKILLUP = {catalog, exams:{[id]: data}}.
   All data is build output from PR-reviewed ajch_skillup content; notes HTML is rendered Markdown by design. */
(function(){
"use strict";
const CAT=window.SKILLUP.catalog;
const $=s=>document.querySelector(s),app=$("#app");
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt=d=>{if(!d)return"";try{return new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"})}catch(e){return d}};
const fmtS=d=>new Date(d+"T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short"});
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove("on"),2400)}
const I={target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',both:'<path d="M4 17l5-5 4 4 7-8"/><path d="M14 8h6v6"/>',seed:'<path d="M12 20v-8"/><path d="M12 12c0-4 3-7 8-7 0 5-3 7-8 7z"/><path d="M12 14c0-3-2-5-7-5 0 4 2 5 7 5z"/>',sprout:'<path d="M12 20V9"/><path d="M12 9c0-3 2-5 6-5 0 4-2 5-6 5z"/><path d="M12 13c0-2.5-2-4-5-4 0 3 2 4 5 4z"/><path d="M6 20h12"/>',tree:'<path d="M12 21v-6"/><path d="M12 3l6 8H6z"/><path d="M12 8l7 8H5z"/>',book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',check:'<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',alert:'<path d="M12 3l9.5 17h-19z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.01"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M18 14a6.5 6.5 0 0 1 3.5 6"/>',layers:'<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>'};
const ic=(n,a='')=>`<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${a}>${I[n]}</svg>`;
const MARK=`<span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="var(--on-indigo)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 20L12 4l7 16"/><path d="M8.5 13h7"/></svg></span>`;
const store={get(k){try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del(k){try{localStorage.removeItem(k)}catch(e){}}};
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const iso=d=>d.toISOString().slice(0,10);

/* ---------- global + per-exam state ---------- */
const G={view:"catalog",filter:"",q:"",exam:null};
let D=null,M=null,TOP=null,QS=null,ORDER=[],Q2T={},S=null;
const cache={};
function load(id){if(!cache[id]){const x=window.SKILLUP.exams[id];if(!x)return false;cache[id]=x}
 D=cache[id];M=D.meta;TOP=D.topics;QS=D.qs;ORDER=D.domains.flatMap(d=>d.tasks);Q2T={};ORDER.forEach(t=>(TOP[t].qids||[]).forEach(q=>{Q2T[q]=Q2T[q]||t}));
 S=Object.assign({step:0,goal:null,exp:null,date:iso(new Date(TODAY.getTime()+28*864e5)),mins:20,progress:{},review:{},open:{},setupDone:false,missed:false},store.get("skillup:"+id)||{});
 S.topic=null;S.dom=null;S.test=null;S.mid=null;D.domains.forEach(d=>{if(S.open[d.id]==null)S.open[d.id]=d.id===D.domains[0].id});G.exam=id;return true}
function save(){if(!S)return;const{topic,dom,test,mid,...keep}=S;store.set("skillup:"+G.exam,keep)}
const progressOf=id=>{const s=store.get("skillup:"+id);if(!s||!s.progress)return null;const done=Object.values(s.progress).filter(v=>v==="done").length;return{done,started:Object.keys(s.progress).length>0}};

/* ---------- derived ---------- */
const daysTo=()=>Math.max(1,Math.round((new Date(S.date+"T00:00:00")-TODAY)/864e5));
const passed=()=>ORDER.filter(id=>S.progress[id]==="done").length;
function readiness(){let tot=0,w=0;D.domains.forEach(d=>{const wt=parseFloat(d.weight)||100/D.domains.length;const sc=d.tasks.reduce((a,id)=>a+({done:1,weak:.45,read:.2}[S.progress[id]]||0),0)/Math.max(1,d.tasks.length);tot+=sc*wt;w+=wt});return Math.round(100*tot/Math.max(1,w))}
function plan(){const speed={new:1,some:.8,hands:.6}[S.exp]||1,depth={exam:.85,skill:1.2,both:1}[S.goal]||1;const need=Math.round(ORDER.length*13*speed*depth+120);const days=Math.ceil(need/S.mins),avail=daysTo();return{days,avail,weeks:Math.max(1,Math.ceil(avail/7)),fit:days<=avail-4,ready:iso(new Date(TODAY.getTime()+days*864e5))}}
const nextTopic=()=>ORDER.find(id=>S.progress[id]!=="done")||ORDER[0];
const domOf=id=>D.domains.find(d=>d.tasks.includes(id));
const nm=id=>TOP[id].short||TOP[id].title;
const isTrack=()=>M.kind==="skill-track";
const unit=()=>isTrack()?"lesson":"topic";
const domWord=()=>isTrack()?"Module":"Domain";

/* ---------- chrome ---------- */
function bar(back,label){return `<div class="bar">${back?`<button class="back" data-a="go" data-v="${back}">‹ ${label||"Back"}</button>`:`<button class="lock" data-a="cat" aria-label="SkillUp catalog">${MARK}<span class="word">Skill<span>Up</span><small>${G.view==="catalog"?"by AaryaAI":esc(M.code)+" · by AaryaAI"}</small></span></button>`}
 <div class="tools">${G.view!=="catalog"?`<button class="ibtn" data-a="cat" aria-label="All exams">${ic("grid")}</button><button class="ibtn" data-a="info" aria-label="Page and version info">${ic("info")}</button>`:""}<button class="ibtn" data-a="theme" aria-label="Switch light or dark">${ic("moon")}</button></div></div>`}
function pageMeta(extra){return `<div class="pmeta"><span title="Content version">v${esc(M.version)}</span><span>Updated ${esc(fmt(M.updated))}</span>${M.asOf?`<span>Skills outline ${esc(M.asOf)}</span>`:""}${extra||""}<button class="plink" data-a="info">Page info</button></div>`}
const footer=()=>G.view==="catalog"?`<footer class="foot"><span>${MARK.replace('class="mark"','class="mark sm"')} SkillUp by AaryaAI</span><span>${CAT.exams.length} learning spaces · built ${esc(fmt(CAT.built))} from the SkillUp content repository</span></footer>`
 :`<footer class="foot"><span>${MARK.replace('class="mark"','class="mark sm"')} SkillUp ${esc(M.code)} · ${esc(M.title)}</span><span>Content v${esc(M.version)} · updated ${esc(fmt(M.updated))}${M.asOf?" · aligned to the official skills outline of "+esc(M.asOf):""}</span></footer>`;
function infoSheet(){const t=G.view==="lesson"&&S.topic?TOP[S.topic]:null;
 return `<div class="sl">Page info</div><h2 style="font-size:24px">${t?esc(t.id+" "+nm(t.id)):esc(M.code+" · "+M.title)}</h2>
 <dl class="dl"><dt>Content version</dt><dd>v${esc(M.version)}</dd><dt>Last updated</dt><dd>${esc(fmt(M.updated))}</dd>${M.asOf?`<dt>Aligned to</dt><dd>Official skills outline, ${esc(M.asOf)}</dd>`:""}<dt>Format</dt><dd>${{lessons:"Skill lessons, one per official objective",classic:"Domain notes (lesson upgrade pending)",track:"Skill track: modules and lessons"}[M.mode]}</dd>
 ${t?`<dt>Read time</dt><dd>${t.mins||"—"} min</dd><dt>Practice questions</dt><dd>${(t.qids||[]).length}</dd>`:`<dt>${isTrack()?"Lessons":"Topics"}</dt><dd>${ORDER.length} across ${D.domains.length} ${isTrack()?"modules":"domains"}</dd><dt>Questions</dt><dd>${M.questions}</dd>${M.duration?`<dt>Exam</dt><dd>${esc(M.duration)} · pass ${esc(M.pass)}</dd>`:""}`}
 ${M.studyGuide?`<dt>Source</dt><dd><a href="${esc(M.studyGuide)}" target="_blank" rel="noopener">Official reference ↗</a></dd>`:""}<dt>Published by</dt><dd>AaryaAI SkillUp</dd></dl>
 ${M.changelog.length?`<div class="sl" style="margin-top:6px">Recent changes</div><ol class="clog">${M.changelog.map(c=>`<li><b>v${esc(c.version)}</b> <span class="mute">${esc(fmt(c.date))}</span><p>${esc((c.summary||"").length>220?c.summary.slice(0,217)+"…":c.summary)}</p></li>`).join("")}</ol>`:""}
 <button class="btn full" data-a="undrawer">Close</button>`}
function sheet(h){const d=$("#drawer");d.innerHTML=`<div class="dpanel">${h}</div>`;d.hidden=false}

/* ---------- catalog ---------- */
function vCatalog(){const ex=CAT.exams,provs=[...new Set(ex.map(e=>e.provider).filter(Boolean))].sort();
 const q=G.q.toLowerCase(),list=ex.filter(e=>(!G.filter||(G.filter==="track"?e.kind==="skill-track":e.provider===G.filter))&&(!q||(e.code+" "+e.title+" "+e.description).toLowerCase().includes(q)));
 const feat=ex.find(e=>e.mode==="lessons")||ex[0];const fp=progressOf(feat.id);
 const card=e=>{const p=progressOf(e.id),pc=p?Math.round(100*p.done/Math.max(1,e.topics)):0;
  return `<button class="ccard" data-a="exam" data-v="${e.id}"><div class="spread"><span class="eyebrow">${esc(e.provider)}${e.level?" · L"+esc(e.level):""}</span><span class="badges">${e.kind==="skill-track"?'<span class="pill">Skill track</span>':""}${e.mode==="lessons"?'<span class="pill green">New lessons</span>':""}</span></div>
  <span class="code">${esc(e.code)}</span><span class="ct">${esc(e.title)}</span><span class="cd">${esc(e.description)}</span>
  <span class="stats"><span><b>${e.topics}</b> ${e.kind==="skill-track"?"lessons":"topics"}</span><span><b>${e.questions}</b> questions</span>${e.cases?`<span><b>${e.cases}</b> cases</span>`:""}${e.diagrams?`<span><b>${e.diagrams}</b> diagrams</span>`:""}</span>
  <span class="cm">${p&&p.started?`<span class="spread tiny"><span>${p.done} of ${e.topics} passed</span><span>${pc}%</span></span><span class="prog" style="margin-top:6px"><i style="width:${pc}%"></i></span>`:`<span class="pmeta" style="font-size:12px"><span>v${esc(e.version)}</span><span>Updated ${esc(fmt(e.updated))}</span></span>`}</span></button>`};
 let h=bar()+`<div class="stack fade"><div class="cat-hero"><div class="eyebrow">AaryaAI SkillUp</div><h1>Learn it. Use it. <span>Pass it.</span></h1><p class="mute" style="max-width:60ch">Certification prep that also builds the skill: short lessons with diagrams, real use cases, practice that adapts to what you know, and a plan that fits your week.</p></div>
 <div class="feature"><div class="stack" style="gap:10px"><span class="badges"><span class="pill green">New lesson format</span><span class="pill brand">Featured</span></span><h2 style="font-size:34px">${esc(feat.code)} · ${esc(feat.title)}</h2><p class="mute">${esc(feat.description)}</p>${pageMetaCat(feat)}<div class="row"><button class="btn go" data-a="exam" data-v="${feat.id}">${fp&&fp.started?"Continue":"Start "+esc(feat.code)}</button></div></div>
 <div class="fstats"><div><b>${feat.topics}</b><span>skill lessons</span></div><div><b>${feat.questions}</b><span>questions</span></div><div><b>${feat.diagrams}</b><span>diagrams</span></div></div></div>
 <div class="stack" style="gap:10px;margin-top:10px"><input class="search" id="cq" type="search" placeholder="Search exams and skills" data-c="q" aria-label="Search exams and skills">
 <div class="chips"><button aria-pressed="${!G.filter}" data-a="filter" data-v="">All</button>${provs.map(p=>`<button aria-pressed="${G.filter===p}" data-a="filter" data-v="${esc(p)}">${esc(p)}</button>`).join("")}${ex.some(e=>e.kind==="skill-track")?`<button aria-pressed="${G.filter==="track"}" data-a="filter" data-v="track">Skill tracks</button>`:""}</div></div>`;
 return h+`<div id="cres">${catalogResults(list,card)}</div></div>${footer()}`}
function catalogResults(list,card){const groups={};list.forEach(e=>(groups[e.provider]=groups[e.provider]||[]).push(e));
 return Object.keys(groups).sort().map(p=>`<div class="provider">${esc(p)}</div><div class="cgrid">${groups[p].map(card).join("")}</div>`).join("")||`<p class="mute" style="margin-top:20px">No exams match your search.</p>`}
const pageMetaCat=e=>`<div class="pmeta"><span>v${esc(e.version)}</span><span>Updated ${esc(fmt(e.updated))}</span><span>${e.topics} ${e.kind==="skill-track"?"lessons":"topics"}</span></div>`;

/* ---------- setup + plan ---------- */
const STEPS=()=>[{k:"goal",q:`What do you want from ${M.code}?`,sub:"This shapes how deep each topic goes.",opts:[["exam","target",isTrack()?"Get productive fast":"Pass the exam",isTrack()?"The essentials, in order":"Focus on what the exam tests"],["skill","wrench","Build real skill","Use cases and hands-on steps first"],["both","both","Both",isTrack()?"Productive and deep":"Exam-ready and able to build with it"]]},
 {k:"exp",q:"Where are you starting from?",sub:"We'll skip what you already know.",opts:[["new","seed","New to this","Start from the basics"],["some","sprout","I know the ideas","But not hands-on"],["hands","tree","I've built with it","Fast-track to the gaps"]]},
 {k:"when",q:isTrack()?"When do you want to finish?":"When is your exam?",sub:"No date yet? Pick a target; you can move it any time."}];
function preview(){const p=plan(),n=Math.min(p.weeks,10),bars=Array.from({length:n},(_,i)=>`<i class="${i===n-1?"rv":i>=n*.45?"d2":""}" style="height:${i===n-1?55:35+((i*37)%45)}%"></i>`).join("");
 return `<aside class="preview fade" aria-live="polite"><div class="eyebrow">Your plan, so far</div><div><div class="bignum">${p.fit?fmtS(p.ready):"Tight"}</div><div class="mute small">${p.fit?"ready-by date, with time to spare before "+fmtS(S.date):"at "+S.mins+" min a day for "+fmtS(S.date)+". Add time or move the date."}</div></div>
 <div class="weeks" aria-hidden="true">${bars}</div><div class="legend"><span style="--c:var(--teal-soft)">Concepts</span><span style="--c:var(--teal)">Build</span><span style="--c:var(--amber)">Review</span></div>
 <div class="kv"><span class="mute">${isTrack()?"Lessons":"Topics"}</span><b>${ORDER.length}</b><span class="mute">Daily time</span><b>${S.mins} min</b><span class="mute">Depth</span><b>${{exam:"Focused",skill:"Skill first",both:"Balanced"}[S.goal]||"—"}</b><span class="mute">Start level</span><b>${{new:"Basics",some:"Skip intro",hands:"Fast-track"}[S.exp]||"—"}</b></div></aside>`}
function vSetup(){const st=STEPS()[S.step];let h=bar(S.step?"_back":"_cat",S.step?"Back":"All exams");
 h+=`<div class="setup"><div class="stack fade"><div class="steps">${[0,1,2].map(i=>`<i class="${i<=S.step?"on":""}"></i>`).join("")}</div>
 <div class="stack" style="gap:6px"><div class="eyebrow">${esc(M.code)} · ${esc(M.title)}</div><h1>${st.q}</h1><p class="mute">${st.sub}</p></div>`;
 if(st.opts)h+=`<div class="stack" style="gap:10px">${st.opts.map(o=>`<button class="choice" aria-pressed="${S[st.k]===o[0]}" data-a="pick" data-k="${st.k}" data-v="${o[0]}"><span class="ic">${ic(o[1])}</span><span><b>${o[2]}</b><span>${o[3]}</span></span></button>`).join("")}</div>`;
 else h+=`<label for="ed" class="eyebrow">${isTrack()?"Target date":"Exam date"}</label><input id="ed" type="date" value="${S.date}" min="${iso(new Date(TODAY.getTime()+864e5))}" data-c="date">
 <div class="eyebrow">Time a day</div><div class="mins">${[[10,"light"],[20,"steady"],[30,"focused"],[45,"intensive"]].map(m=>`<button aria-pressed="${S.mins===m[0]}" data-a="mins" data-v="${m[0]}">${m[0]}<small>min · ${m[1]}</small></button>`).join("")}</div>
 <button class="btn go full" data-a="build">Build my plan</button>`;
 return h+`</div>${preview()}</div>`}
function vReady(){const p=plan(),maxT=Math.max(...D.domains.map(x=>x.tasks.length));return bar()+`<div class="stack fade"><div class="eyebrow">Plan ready</div><h1>${p.fit?"You'll be ready by "+fmtS(p.ready)+".":"It's tight, but doable."}</h1>
 <p class="mute">${S.mins} minutes a day, ${ORDER.length} ${unit()}s, target ${fmtS(S.date)}. ${p.fit?"That leaves time for a full review week.":"Consider 10 more minutes a day."}</p>
 <div class="path"><div class="spread"><span class="eyebrow">Your route</span><span class="tiny mute">each dot is a ${unit()}</span></div>${D.domains.map((d,j)=>`<div class="stack" style="gap:6px"><div class="tiny mute">${esc(d.title)}</div><div class="lane" style="grid-template-columns:repeat(${Math.min(15,maxT)},1fr)">${d.tasks.map((id,i)=>`<i class="k" style="animation-delay:${(j*15+i)*25}ms" title="${esc(id+" "+nm(id))}"></i>`).join("")}</div></div>`).join("")}</div>
 <p class="h" style="font-size:22px;margin-top:6px">How would you like to start?</p>
 <button class="door lead" data-a="assess"><span class="ic">${ic("check")}</span><span><b>Find out what I already know</b><span class="mute small">A quick check across the ${isTrack()?"modules":"domains"}. ${isTrack()?"Lessons":"Topics"} you know are marked done.</span></span><span class="arrow">›</span></button>
 <button class="door" data-a="go" data-v="notes"><span class="ic">${ic("book")}</span><span><b>Start studying</b><span class="mute small">Begin with ${esc(ORDER[0]+" "+nm(ORDER[0]))}.</span></span><span class="arrow">›</span></button></div>${footer()}`}

/* ---------- exam home ---------- */
function vHome(){const n=nextTopic(),t=TOP[n],r=readiness(),due=Object.keys(S.review).filter(id=>TOP[id]);
 let h=bar();
 if(S.missed)h+=`<div class="welcome fade"><b class="h" style="font-size:22px">Welcome back.</b><p>You were away for a few days. Nothing is lost and there's no catch-up pile. Today is a lighter 15-minute session.</p><div class="row"><button class="btn sm go" data-a="unmiss">Sounds good</button><button class="btn sm" data-a="replan">Change my plan</button></div></div>`;
 h+=`<div class="stack fade" style="margin-top:${S.missed?18:0}px"><div class="hero"><div class="spread"><span class="eyebrow">Next up${t.mins?" · about "+t.mins+" min":""}</span><span class="pill">${esc(n)}</span></div>
 <h1 style="font-size:36px">${esc(nm(n))}</h1><button class="btn go" data-a="open" data-v="${n}">Continue learning</button></div>
 ${due.length?`<div class="due">${ic("alert",'style="width:22px;height:22px;stroke:var(--amber);flex:none"')}<span style="flex:1"><b>${due.length} ${unit()}${due.length>1?"s":""} to refresh.</b> <span class="mute small">You were unsure last time. Two minutes now makes it stick.</span></span><button class="btn sm" data-a="test" data-v="${due[0]}">Refresh ${esc(due[0])}</button></div>`:""}
 <div class="row card"><div class="ring" style="--p:${r}" data-v="${r}%"></div><div style="flex:1;min-width:170px"><b>${isTrack()?"Track progress":"Exam readiness"}</b><div class="mute small">${passed()} of ${ORDER.length} ${unit()}s passed · ${daysTo()} days to ${fmtS(S.date)} · ${S.mins} min a day</div></div><button class="btn sm" data-a="replan">Plan</button></div>
 <div class="grid3"><button class="tile" data-a="go" data-v="notes">${ic("book")}<b>Study notes</b><span>${ORDER.length} ${unit()}s</span></button><button class="tile" data-a="go" data-v="practice">${ic("check")}<b>Practice</b><span>${M.questions} questions</span></button><button class="tile" data-a="go" data-v="cases" ${D.cases.length?"":"disabled"}>${ic("users")}<b>Case studies</b><span>${D.cases.length||"None yet"}</span></button></div>
 ${pageMeta()}</div><div class="demo"><span>Prototype controls:</span><button data-a="miss">Simulate days away</button><button data-a="reset">Reset this exam</button></div>${footer()}`;
 return h}

/* ---------- study notes list ---------- */
const stLabel=id=>({done:'<div class="ts" style="color:var(--green)">Passed</div>',weak:'<div class="ts" style="color:var(--amber)">Refresh soon</div>',read:'<div class="ts" style="color:var(--teal)">Read, not tested</div>'})[S.progress[id]]||"";
function vNotes(){let h=bar("home",M.code)+`<div class="stack fade" style="gap:8px;margin-bottom:10px"><h1>Study notes</h1><p class="mute">Read a ${unit()}, or test yourself if you think you already know it.</p>${pageMeta(`<span>${ORDER.length} ${unit()}s</span>`)}${M.mode==="classic"?`<p class="classic-note">These notes are organised by domain. They're being rewritten into one short lesson per objective; tests and practice already work per ${unit()}.</p>`:""}</div>`;
 h+=D.domains.map(d=>{const dn=d.tasks.filter(id=>S.progress[id]==="done").length,pc=Math.round(100*dn/Math.max(1,d.tasks.length));
  const domRow=M.mode==="lessons"?`<div class="topic dov"><span class="tid">${ic("layers",'style="width:20px;height:20px;stroke:var(--teal)"')}</span><div class="tn">${domWord()} overview, deep dive and cheat sheet</div><div class="acts"><button class="btn sm" data-a="dpage" data-v="${d.id}">Open</button></div></div>`
   :M.mode==="classic"?`<div class="topic dov"><span class="tid">${ic("book",'style="width:20px;height:20px;stroke:var(--teal)"')}</span><div class="tn">Read the ${domWord().toLowerCase()} ${d.id} notes<div class="tiny mute">${(D.domainPages[d.id]||{}).mins||"—"} min · ${((D.domainPages[d.id]||{}).toc||[]).length} sections</div></div><div class="acts"><button class="btn sm" data-a="dpage" data-v="${d.id}">Read</button></div></div>`:"";
  return `<section class="dom"><button aria-expanded="${!!S.open[d.id]}" data-a="fold" data-v="${d.id}"><span><span class="eyebrow">${domWord()} ${d.id}${d.weight?" · "+esc(d.weight)+" of the exam":""}</span><div class="dt">${esc(d.title)}</div><div class="mbar"><i style="width:${pc}%"></i></div><div class="tiny mute" style="margin-top:4px">${dn} of ${d.tasks.length} passed</div></span><span class="h" style="font-size:28px;color:var(--teal)">${S.open[d.id]?"−":"+"}</span></button>
  ${S.open[d.id]?domRow+d.tasks.map(id=>{const t=TOP[id];const canRead=M.mode!=="classic";return `<div class="topic"><span class="tid">${esc(id.replace(/^m(\d+)-l/,"$1."))}</span><div class="tn" title="${esc(t.title)}">${esc(nm(id))}<div class="tiny mute">${t.mins?t.mins+" min · ":""}${(t.qids||[]).length} questions</div>${stLabel(id)}</div><div class="acts">${canRead?`<button class="btn sm" data-a="open" data-v="${id}">Read</button>`:""}<button class="btn sm" data-a="test" data-v="${id}" ${(t.qids||[]).length?"":"disabled"}>Test</button></div></div>`}).join(""):""}</section>`}).join("");
 return h+footer()}

/* ---------- domain page: lessons-mode overview, or classic full notes ---------- */
const slug=s=>"h-"+s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
function vDomain(){const d=D.domains.find(x=>x.id===S.dom),p=D.domainPages[d.id]||{};
 if(M.mode==="classic"){const toc=p.toc||[];
  return `<div class="mob">${bar("notes","Study notes")}<div class="rprog"><i class="rp"></i></div></div><div class="desk"><aside class="side">${domainNav(d.id)}</aside>
  <article class="read fade"><div class="lhead"><span class="eyebrow">${domWord()} ${d.id}${d.weight?" · "+esc(d.weight)+" of the exam":""}</span><h1>${esc(d.title)}</h1>${pageMeta(`<span>${p.mins||"—"} min read</span><span>${d.tasks.length} ${unit()}s</span>`)}</div>
  <div class="md classic" id="classic">${p.classicHtml||"<p>No notes yet.</p>"}</div>
  <div class="stack" style="padding-top:26px"><button class="btn go full" data-a="test" data-v="${d.tasks.find(id=>(TOP[id].qids||[]).length)||d.tasks[0]}">Test yourself on this ${domWord().toLowerCase()}</button></div>${footer()}</article>
  <aside class="side"><div class="sl">On this page</div><nav class="toc" aria-label="Sections">${toc.map((h,i)=>`<a href="#${slug(h)}" class="${i?"":"on"}" data-a="nav">${esc(h.replace(/[*_`]/g,""))}</a>`).join("")}</nav><div class="tiny mute" style="margin-top:6px">Reading progress</div><div class="rprog"><i class="rp"></i></div></aside></div>`}
 return bar("notes","Study notes")+`<article class="read fade" style="margin:0 auto"><div class="lhead"><span class="eyebrow">${domWord()} ${d.id}${d.weight?" · "+esc(d.weight)+" of the exam":""}</span><h1>${esc(d.title)}</h1>${pageMeta(`<span>${d.tasks.length} ${unit()}s</span>`)}</div>
 ${p.overview?`<section class="sec"><h3>Overview</h3><div class="md">${p.overview}</div></section>`:""}${p.deep?`<section class="sec"><h3>Deep dive${p.deepTitle?": "+esc(p.deepTitle):""}</h3><div class="md">${p.deep}</div></section>`:""}${p.cheat?`<section class="sec"><h3>Cheat sheet</h3><div class="md">${p.cheat}</div></section>`:""}
 <div class="stack" style="padding-top:22px"><button class="btn go full" data-a="open" data-v="${d.tasks[0]}">Start with ${esc(d.tasks[0]+" "+nm(d.tasks[0]))}</button></div>${footer()}</article>`}
function domainNav(cur){return `<div class="sl">${M.code}</div><div class="st">${domWord()}s</div><nav class="tlist">${D.domains.map(d=>`<button class="${d.id===cur?"cur":""}" data-a="dpage" data-v="${d.id}"><span class="n">${d.id}</span><span>${esc(d.title)}</span><span></span></button>`).join("")}</nav><button class="back" data-a="go" data-v="notes" style="margin-top:8px">‹ All study notes</button>`}

/* ---------- lesson ---------- */
const SECNAME={use:"Real use",how:"How it works",choose:"Choose when",do:"How to do it",trap:"Exam trap",more:"Go deeper"};
function quickQ(t){const ids=t.qids||[];const e=ids.find(id=>QS[id]&&QS[id].d==="easy")||ids[0];return e?QS[e]:null}
function secList(t){if(t.classicHtml!=null)return[["s-key","Objectives"]].concat((t.toc||[]).map(h=>[slug(h),h.replace(/[*_`]/g,"")]));const l=[["s-key","Key idea"]];t.secs.forEach(s=>{l.push(["s-"+s.k,SECNAME[s.k]]);if(s.k==="choose"&&quickQ(t))l.push(["s-check","Quick check"])});if(!t.secs.some(s=>s.k==="choose")&&quickQ(t))l.push(["s-check","Quick check"]);return l}
function topicsNav(id){const d=domOf(id);return `<div class="sl">${domWord()} ${d.id}</div><div class="st">${esc(d.title)}</div><nav class="tlist" aria-label="${unit()}s here">${d.tasks.map(x=>`<button class="${x===id?"cur":""}" ${x===id?'aria-current="page"':""} data-a="open" data-v="${x}"><span class="n">${esc(x.replace(/^m(\d+)-l/,"$1."))}</span><span title="${esc(TOP[x].title)}">${esc(nm(x))}</span><span class="dot ${S.progress[x]||""}"></span></button>`).join("")}</nav>`}
const tocNav=t=>`<div class="sl">On this page</div><nav class="toc" aria-label="Sections">${secList(t).map((s,i)=>`<a href="#${s[0]}" class="${i?"":"on"}" data-a="nav">${esc(s[1])}</a>`).join("")}</nav>`;
function midBlock(t){const q=quickQ(t);if(!q)return"";const ms=S.mid;
 return `<section class="sec" id="s-check"><h3>Quick check</h3><div class="check">${q.s?`<p class="mute small">${esc(q.s)}</p>`:""}<b>${esc(q.q)}</b>
 ${q.o.map((o,i)=>{let c="";if(ms!=null){if(i===q.c)c="right";else if(i===ms)c="wrong"}return `<button class="opt ${c}" ${ms!=null?"disabled":""} data-a="mid" data-v="${i}"><span class="l">${"ABCD"[i]}</span><span>${esc(o)}</span></button>`}).join("")}
 ${ms!=null?`<p class="small"><b>${ms===q.c?"Yes.":"Close."}</b> ${esc(q.e)}</p>`:`<p class="tiny mute">Recalling it now, before you read on, helps it stick far better than re-reading.</p>`}</div></section>`}
function vLesson(){const id=S.topic,t=TOP[id],d=domOf(id),i=d.tasks.indexOf(id),nx=d.tasks[i+1]||((D.domains[D.domains.indexOf(d)+1]||{tasks:[]}).tasks[0]);
 let body;
 if(t.classicHtml!=null){body=`<section class="sec" id="s-key"><h3>What you'll be able to do</h3><ul class="objectives">${(t.objectives||[]).map(o=>`<li>${esc(o)}</li>`).join("")}</ul>${t.lab?`<p class="small mute">Hands-on lab: <b>${esc(t.lab)}</b></p>`:""}</section><div class="md classic">${t.classicHtml}</div>${midBlock(t)}`}
 else{body=`<section class="sec" id="s-key"><h3>Key idea</h3>${t.claim?`<p class="claim">${esc(t.claim)}</p>`:""}<div class="md analogy-md">${t.keyHtml||""}</div>${(t.figs||[]).map(f=>`<figure class="fig img"><img src="${esc(f.src)}" alt="${esc(f.alt)}" loading="lazy"><figcaption>${esc(f.alt)}</figcaption></figure>`).join("")}</section>`;
  let placed=false;t.secs.forEach(s=>{body+=`<section class="sec" id="s-${s.k}"><h3>${SECNAME[s.k]}</h3><div class="md md-${s.k}">${s.html}</div></section>`;if(s.k==="choose"){body+=midBlock(t);placed=true}});if(!placed)body+=midBlock(t)}
 return `<div class="mob">${bar("notes","Study notes")}<div class="spread"><span class="tiny mute">${esc(id)}${t.mins?" · "+t.mins+" min read":""}</span><button class="btn sm" data-a="drawer">${ic("menu",'style="width:18px;height:18px;stroke:currentColor"')} ${isTrack()?"Lessons":"Topics"}</button></div><div class="rprog"><i class="rp"></i></div></div>
 <div class="desk"><aside class="side">${topicsNav(id)}<button class="back" data-a="go" data-v="notes" style="margin-top:8px">‹ All study notes</button></aside>
 <article class="read fade"><div class="lhead"><div class="spread"><span class="eyebrow">${domWord()} ${d.id} · ${isTrack()?"Lesson":"Topic"} ${esc(id.replace(/^m(\d+)-l/,"$1."))}</span>${S.progress[id]==="done"?'<span class="pill green">Passed</span>':S.progress[id]==="weak"?'<span class="pill amber">Refresh soon</span>':""}</div><h1>${esc(nm(id))}</h1>${nm(id)!==t.title?`<p class="objective"><span>${isTrack()?"Lesson":"Official objective"}</span>${esc(t.title)}</p>`:""}${pageMeta(`${t.mins?`<span>${t.mins} min read</span>`:""}<span>${(t.qids||[]).length} questions</span>`)}</div>
 ${body}
 <div class="stack" style="padding-top:26px">${(t.qids||[]).length?`<button class="btn go full" data-a="test" data-v="${id}">Test this ${unit()} · ${t.qids.length} questions</button>`:""}${nx?`<button class="btn full" data-a="open" data-v="${nx}">Next: ${esc(nm(nx))} ›</button>`:""}</div>${footer()}</article>
 <aside class="side">${tocNav(t)}<div class="tiny mute" style="margin-top:6px">Reading progress</div><div class="rprog"><i class="rp"></i></div></aside></div>`}
function track(){if(G.view!=="lesson"&&G.view!=="dpage")return;let ids;if(G.view==="lesson")ids=secList(TOP[S.topic]).map(s=>s[0]);else ids=[...document.querySelectorAll(".toc a")].map(a=>a.getAttribute("href").slice(1));
 let cur=0;ids.forEach((s,i)=>{const el=document.getElementById(s);if(el&&el.getBoundingClientRect().top<140)cur=i});
 document.querySelectorAll(".toc a").forEach((a,i)=>a.classList.toggle("on",i===cur));const h=document.documentElement,pc=Math.min(100,100*scrollY/Math.max(1,h.scrollHeight-innerHeight));document.querySelectorAll(".rp").forEach(e=>e.style.width=pc+"%")}
addEventListener("scroll",track,{passive:true});
function anchorHeadings(){document.querySelectorAll(".md.classic h2").forEach(h=>{h.id=slug(h.textContent.trim())})}

/* ---------- practice, cases, tests ---------- */
function vPractice(){const weak=ORDER.filter(id=>S.progress[id]==="weak"),n=Math.min(40,M.questions);
 return bar("home",M.code)+`<div class="stack fade"><h1>Practice</h1><p class="mute">Every answer explains why each option is right or wrong.</p>${pageMeta(`<span>${M.questions} questions</span>`)}
 <button class="door lead" data-a="assess"><span class="ic">${ic("check")}</span><span><b>Skill check · up to 12 questions</b><span class="mute small">About 10 minutes across the ${isTrack()?"modules":"domains"}. Updates your progress.</span></span><span class="arrow">›</span></button>
 ${weak.length?`<button class="door" data-a="test" data-v="${weak[0]}"><span class="ic">${ic("alert")}</span><span><b>Refresh weak ${unit()}s</b><span class="mute small">${weak.length} marked "refresh soon", starting with ${esc(weak[0]+" "+nm(weak[0]))}.</span></span><span class="arrow">›</span></button>`:""}
 ${n>=10?`<button class="door" data-a="xstart"><span class="ic">${ic("clock")}</span><span><b>Practice exam · ${n} questions · ${Math.round(n*1.1)} min</b><span class="mute small">Timed, no feedback until the end, scored against ${M.passThreshold}%.</span></span><span class="arrow">›</span></button>`:""}
 ${D.cases.length?`<button class="door" data-a="go" data-v="cases"><span class="ic">${ic("users")}</span><span><b>Case studies</b><span class="mute small">${D.cases.length} real-world scenarios that span several ${unit()}s.</span></span><span class="arrow">›</span></button>`:""}</div>${footer()}`}
function vCases(){return bar("home",M.code)+`<div class="stack fade"><h1>Case studies</h1><p class="mute">One realistic situation, several decisions. This is how the knowledge gets used at work.</p>${pageMeta()}
 ${D.cases.map(c=>`<article class="case-card"><span class="eyebrow">${c.mins||10} min · ${c.qs.length} decisions${c.taskIds.length?" · "+c.taskIds.slice(0,4).join(", ")+(c.taskIds.length>4?"…":""):""}</span><h2>${esc(c.title)}</h2><p class="mute small">${esc(c.desc)}</p>
 ${c.chars.length?`<div class="people">${c.chars.map(p=>`<div><b>${esc(p.name)}</b><span>${esc(p.role)}</span><p>${esc(p.concern||"")}</p></div>`).join("")}</div>`:""}<button class="btn go" data-a="case" data-v="${c.id}">Work through it</button></article>`).join("")}</div>${footer()}`}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function start(mode,items,extra){items=items.filter(Boolean);if(!items.length){toast("No questions for this yet");return}S.test=Object.assign({mode,items,i:0,pick:null,sure:null,res:[],answers:[]},extra||{});go("test")}
const startTopic=id=>start("topic",(TOP[id].qids||[]).map(q=>QS[q]),{topic:id});
function startAssess(){const per=Math.max(2,Math.ceil(12/D.domains.length)),items=[];D.domains.forEach(d=>{shuffle(d.tasks.filter(id=>(TOP[id].qids||[]).length)).slice(0,per).forEach(id=>{const ids=TOP[id].qids;items.push(QS[ids.find(q=>QS[q].d!=="hard")||ids[0]])})});start("check",items.slice(0,12))}
function startExam(){const n=Math.min(40,M.questions);start("exam",shuffle(Object.values(QS)).slice(0,n),{ends:Date.now()+Math.round(n*1.1)*60e3})}
const startCase=id=>start("case",D.cases.find(x=>x.id===id).qs,{caseId:id});
function head(t){const back=t.mode==="topic"?"notes":t.mode==="case"?"cases":"practice",label={topic:(isTrack()?"Lesson ":"Topic ")+t.topic,check:"Skill check",exam:"Practice exam",case:"Case study"}[t.mode];
 return bar(back,"Leave")+`<div class="qprog">${t.items.map((_,i)=>`<i class="${i<t.res.length?(t.res[i].ok?"r":"w"):t.mode==="exam"&&t.answers[i]!=null?"c2":i===t.i?"c":""}"></i>`).join("")}</div>
 <div class="spread"><span class="eyebrow">${label} · question ${t.i+1} of ${t.items.length}</span>${t.mode==="exam"?`<span class="pill">${ic("clock",'style="width:14px;height:14px;stroke:currentColor"')} <span id="tleft">--:--</span></span>`:""}</div>`}
function vTest(){const t=S.test,q=t.items[t.i];if(!q)return vResult();
 if(t.mode==="exam")return `<div class="stack fade">${head(t)}${q.s?`<p class="mute">${esc(q.s)}</p>`:""}<h2>${esc(q.q)}</h2><div class="stack" style="gap:8px">${q.o.map((o,i)=>`<button class="opt ${t.answers[t.i]===i?"picked":""}" data-a="xans" data-v="${i}"><span class="l">${"ABCDEF"[i]}</span><span>${esc(o)}</span></button>`).join("")}</div>
 <div class="row"><button class="btn" data-a="xprev" ${t.i?"":"disabled"}>‹ Previous</button><button class="btn go" style="flex:1" data-a="xnext">${t.i+1<t.items.length?"Next ›":"Finish and score"}</button></div></div>`;
 const answered=t.sure!=null,c=t.mode==="case"?D.cases.find(x=>x.id===t.caseId):null;
 let h=`<div class="stack fade">${head(t)}${c&&t.i===0&&c.bg?`<div class="case"><span class="ic">${ic("users")}</span><div><div class="who">The situation</div><p>${esc(c.bg)}</p></div></div>`:""}${q.s?`<p class="mute">${esc(q.s)}</p>`:""}<h2>${esc(q.q)}</h2>
 <div class="stack" style="gap:8px">${q.o.map((o,i)=>{let cl="";if(answered){if(i===q.c)cl="right";else if(i===t.pick)cl="wrong"}else if(i===t.pick)cl="picked";return `<button class="opt ${cl}" ${answered?"disabled":""} data-a="ans" data-v="${i}"><span class="l">${"ABCDEF"[i]}</span><span>${esc(o)}</span></button>`}).join("")}</div>`;
 if(t.pick!=null&&!answered)h+=`<div class="stack fade" style="gap:8px"><b>How sure are you?</b><div class="sure"><button class="btn" data-a="sure" data-v="1">I know it</button><button class="btn" data-a="sure" data-v="0">I'm guessing</button></div><p class="tiny mute">Rating your confidence shows us what to bring back for review.</p></div>`;
 if(answered){const ok=t.pick===q.c,msg=ok&&t.sure?"Correct, and you knew it.":ok?"Correct, but you were guessing. We'll bring this back to lock it in.":t.sure?"Not quite, and you felt sure. That's the most useful kind of mistake to catch now.":"Not quite. Good call flagging it as a guess.";
  const tid=Q2T[q.id];h+=`<div class="fb fade"><b>${msg}</b><p class="why">${esc(q.e)}</p>${!ok&&tid&&t.mode!=="topic"&&M.mode!=="classic"?`<button class="plink" data-a="open" data-v="${tid}">Read ${esc(tid+" "+nm(tid))} ›</button>`:""}</div><button class="btn go full" data-a="next">${t.i+1<t.items.length?"Next question":"See my result"}</button>`}
 return h+`</div>`}
function finish(){const t=S.test;if(t.mode==="exam")t.res=t.items.map((q,i)=>({ok:t.answers[i]===q.c,sure:true}));
 const r=t.res.filter(x=>x.ok).length,n=t.items.length,shaky=t.res.filter(x=>x.ok&&!x.sure).length;
 if(t.mode==="topic"){const pass=r===n;S.progress[t.topic]=pass?"done":"weak";if(!pass||shaky)S.review[t.topic]=1;else delete S.review[t.topic]}
 else if(t.mode==="check")t.items.forEach((q,i)=>{const id=Q2T[q.id];if(!id)return;if(t.res[i].ok&&t.res[i].sure)S.progress[id]="done";else{S.progress[id]="weak";S.review[id]=1}});
 t.done={r,n,shaky};save()}
function vResult(){const t=S.test;if(!t.done)finish();const{r,n,shaky}=t.done,pc=Math.round(100*r/n),pass=r===n;
 if(t.mode==="exam"){const by={};t.items.forEach((q,i)=>{const b=by[q.dom]=by[q.dom]||{r:0,n:0};b.n++;if(t.res[i].ok)b.r++});const ok=pc>=M.passThreshold;
  return bar("practice","Practice")+`<div class="result fade"><div class="eyebrow">Practice exam complete</div><div class="ring big" style="--p:${pc}" data-v="${pc}%"></div><h1>${ok?"That's a pass.":"Not a pass yet."}</h1><p class="mute">You scored ${r} of ${n}. The pass mark is ${M.passThreshold}%.</p>
  <div class="sched">${D.domains.map(d=>{const b=by[d.id]||{r:0,n:0};return b.n?`<div><b>${domWord()} ${d.id}</b><span>${b.r} of ${b.n} correct · ${esc(d.title)}</span></div>`:""}).join("")}</div>
  <div class="row" style="width:100%"><button class="btn go" style="flex:1" data-a="go" data-v="notes">Study notes</button><button class="btn" style="flex:1" data-a="go" data-v="practice">Practice</button></div></div>${footer()}`}
 const back=t.mode==="topic"?"notes":t.mode==="case"?"cases":"home";
 const headline=t.mode==="check"?"Here's where you stand.":pass&&!shaky?"Locked in.":pass?"Right, but a little shaky.":"Nearly there.";
 const blurb=t.mode==="check"?`You got ${r} of ${n}. What you answered confidently is marked done; the rest is flagged to study first.`:pass&&!shaky?"You got every one and you knew it.":pass?`You guessed ${shaky}. We'll bring ${shaky>1?"them":"it"} back for a 2-minute refresh.`:"The explanations show the gap. A quick re-read usually fixes it.";
 return bar(back,"Done")+`<div class="result fade"><div class="eyebrow">${{topic:(isTrack()?"Lesson ":"Topic ")+t.topic,check:"Skill check",case:"Case study"}[t.mode]} complete</div><div class="ring big" style="--p:${pc}" data-v="${r}/${n}"></div><h1>${headline}</h1><p class="mute">${blurb}</p>
 <div class="sched"><div><b>Tomorrow</b><span>${pass&&!shaky?"Nothing to do here":"2-minute refresh of what you missed"}</span></div><div><b>In 4 days</b><span>One question to check it stuck</span></div><div><b>${isTrack()?"Final week":"Exam week"}</b><span>Included in your final review</span></div></div>
 <div class="row" style="width:100%">${t.mode==="topic"&&!pass&&M.mode!=="classic"?`<button class="btn go" style="flex:1" data-a="open" data-v="${t.topic}">Re-read ${esc(t.topic)}</button>`:""}<button class="btn ${t.mode==="topic"&&!pass&&M.mode!=="classic"?"":"go"}" style="flex:1" data-a="go" data-v="${t.mode==="check"?"home":back}">${t.mode==="check"?"See my plan":"Continue"}</button></div></div>${footer()}`}
setInterval(()=>{const el=$("#tleft");if(!el||!S||!S.test||!S.test.ends)return;const s=Math.max(0,Math.round((S.test.ends-Date.now())/1000));el.textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;if(!s){S.test.i=S.test.items.length;render()}},1000);

/* ---------- router ---------- */
const calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
function go(v){const run=()=>{G.view=v;if(S)S.mid=null;$("#drawer").hidden=true;render();scrollTo(0,0)};if(document.startViewTransition&&!calm)document.startViewTransition(run);else run()}
function render(){app.className="wrap"+(G.view==="lesson"||(G.view==="dpage"&&M&&M.mode==="classic")?" wide":G.view==="setup"?" setupw":G.view==="catalog"?" wide":"");
 app.innerHTML=({catalog:vCatalog,setup:vSetup,ready:vReady,home:vHome,notes:vNotes,dpage:vDomain,lesson:vLesson,practice:vPractice,cases:vCases,test:vTest})[G.view]();
 if(G.view==="catalog"){const s=$("#cq");if(s)s.value=G.q}
 if(G.view==="dpage"||G.view==="lesson")anchorHeadings();track();save()}
const ACT={
 go:v=>{if(v==="_back"){S.step--;render();return}if(v==="_cat"){go("catalog");return}go(v)},
 cat:()=>go("catalog"),exam:v=>{if(!load(v))return;go(S.setupDone?"home":"setup")},
 filter:v=>{G.filter=v;render()},
 theme:()=>{const r=document.documentElement,d=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;r.dataset.theme=d?"light":"dark"},
 info:()=>sheet(infoSheet()),undrawer:()=>{$("#drawer").hidden=true},
 pick:(v,el)=>{S[el.dataset.k]=v;render();setTimeout(()=>{S.step++;render()},240)},
 mins:v=>{S.mins=+v;render()},build:()=>{S.setupDone=true;go("ready")},replan:()=>{S.step=2;S.missed=false;go("setup")},
 assess:()=>startAssess(),xstart:()=>startExam(),case:v=>startCase(v),
 open:v=>{S.topic=v;S.progress[v]=S.progress[v]||"read";go("lesson")},dpage:v=>{S.dom=+v;go("dpage")},
 test:v=>startTopic(v),fold:v=>{S.open[v]=!S.open[v];render()},
 mid:v=>{S.mid=+v;const y=scrollY;render();scrollTo(0,y)},
 drawer:()=>sheet(topicsNav(S.topic)+tocNav(TOP[S.topic])+'<button class="btn full" data-a="undrawer">Close</button>'),nav:()=>{$("#drawer").hidden=true},
 ans:v=>{S.test.pick=+v;render()},
 sure:v=>{const t=S.test;t.sure=v==="1";t.res.push({ok:t.pick===t.items[t.i].c,sure:t.sure});render()},
 next:()=>{const t=S.test;t.i++;t.pick=null;t.sure=null;render();scrollTo(0,0)},
 xans:v=>{S.test.answers[S.test.i]=+v;render()},xprev:()=>{S.test.i--;render()},xnext:()=>{S.test.i++;render();scrollTo(0,0)},
 miss:()=>{S.missed=true;render()},unmiss:()=>{S.missed=false;toast("Today: a light 15 minutes");render()},
 reset:()=>{store.del("skillup:"+G.exam);load(G.exam);go("setup")}};
document.addEventListener("click",e=>{const el=e.target.closest("[data-a]");if(!el)return;const f=ACT[el.dataset.a];if(!f)return;if(el.tagName==="A"&&el.dataset.a!=="nav")e.preventDefault();f(el.dataset.v,el)});
$("#drawer").addEventListener("click",e=>{if(e.target.id==="drawer")e.target.hidden=true});
document.addEventListener("change",e=>{if(e.target.dataset.c==="date"){S.date=e.target.value;render()}});
document.addEventListener("input",e=>{if(e.target.dataset.c==="q"){G.q=String(e.target.value||"").slice(0,80);const tmp=document.createElement("div");tmp.innerHTML=vCatalog();const fresh=tmp.querySelector("#cres"),cur=$("#cres");if(fresh&&cur)cur.replaceChildren(...fresh.childNodes)}});
render();
})();
