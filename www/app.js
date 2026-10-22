'use strict';
const VERSION='0.3';
const CATS=['Food','Travel','Bills','Shopping','Health','Other'];
const RULES=[
 ['Food',/swiggy|zomato|dominos|pizza|kfc|mcdonald|burger|cafe|restaurant|hotel|bakery|tea|coffee|juice|mess|canteen|biryani|snack|lunch|dinner|breakfast|grocer|bigbasket|blinkit|zepto|instamart|dmart|supermarket|milk|veg|fruit/i],
 ['Travel',/uber|ola\b|rapido|irctc|redbus|metro|bus|auto|cab|petrol|diesel|fuel|bpcl|hpcl|iocl|indianoil|fastag|toll|parking|train|flight|indigo|makemytrip|abhibus|taxi/i],
 ['Bills',/jio|airtel|vodafone|vi\b|bsnl|recharge|electric|tneb|tangedco|eb\b|water|gas|broadband|wifi|dth|tatasky|insurance|lic\b|emi|loan|rent|netflix|spotify|hotstar|prime|bill|fees|fee\b|school|college/i],
 ['Shopping',/amazon|flipkart|myntra|ajio|meesho|nykaa|shop|store|mart\b|textile|fashion|cloth|shirt|mobile|electronics|croma|reliance|decathlon|lifestyle|max\b/i],
 ['Health',/pharma|medical|medplus|apollo|netmeds|1mg|hospital|clinic|doctor|dr\b|lab\b|diagnostic|dental|health|gym|cult/i]];
const $=s=>document.querySelector(s);
const K='dayleft1';
const NP=(window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.DayLeft)||null;
const DEF={setup:false,income:0,fixed:0,save:0,tx:[],budgets:{},rec:[],goal:null,learn:{},dark:false};
let S;
try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(K)||'{}'))}catch(e){S=Object.assign({},DEF)}
['tx','rec'].forEach(k=>{if(!Array.isArray(S[k]))S[k]=[]});if(!S.budgets||typeof S.budgets!=='object')S.budgets={};if(!S.learn||typeof S.learn!=='object')S.learn={};
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){toast('Storage full. Export a backup.')}sync()};
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const td=()=>ymd(new Date());
const dimOf=(y,m)=>new Date(y,m+1,0).getDate();
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const pd=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const nice=s=>{const d=pd(s);return DAYS[d.getDay()]+', '+d.getDate()+' '+MON[d.getMonth()]};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>(n<0?'-':'')+'₹'+Math.abs(Math.round(n)).toLocaleString('en-IN');
const recTotal=()=>S.rec.reduce((s,r)=>s+r.a,0);
const fixedTotal=()=>(+S.fixed||0)+recTotal();
const daily=()=>Math.max(0,Math.round((S.income-fixedTotal()-(+S.save||0))/30));
const vx=()=>S.tx.filter(x=>!x.rec);
const tot=d=>vx().filter(x=>x.d==d).reduce((s,x)=>s+x.a,0);
const guess=(n)=>{n=(n||'').trim();if(!n)return null;const k=n.toLowerCase();if(S.learn[k])return S.learn[k];for(const[c,r]of RULES)if(r.test(n))return c;return null};
function sync(){if(!NP||!S.setup)return;NP.setSummary({daily:daily(),spent:tot(td()),date:td(),bills:JSON.stringify(S.rec.map(r=>({n:r.n,a:r.a,d:r.day})))}).catch(()=>{})}
/* recurring bills: added on their due day, counted as fixed (not daily spend) */
function runRecurring(){const n=new Date(),ym=n.getFullYear()+'-'+pad(n.getMonth()+1);let ch=0;
 S.rec.forEach(r=>{const due=Math.min(r.day,dimOf(n.getFullYear(),n.getMonth()));if(r.last!==ym&&n.getDate()>=due){S.tx.push({id:Date.now()+ch++,n:r.n,a:r.a,c:r.c,d:ym+'-'+pad(due),t:'00:00',rec:1});r.last=ym}});if(ch)save()}
/* streak: consecutive days (ending today/yesterday) at or under the daily budget since first entry */
function streak(){const v=vx();if(!v.length||!daily())return 0;const first=v.map(x=>x.d).sort()[0];let d=new Date(),n=0;if(tot(ymd(d))>daily())d.setDate(d.getDate()-1);
 for(let i=0;i<400;i++){const k=ymd(d);if(k<first)break;if(tot(k)>daily())break;n++;d.setDate(d.getDate()-1)}return n}
function monthRange(off){const n=new Date();const d=new Date(n.getFullYear(),n.getMonth()+off,1);return{y:d.getFullYear(),m:d.getMonth(),key:d.getFullYear()+'-'+pad(d.getMonth()+1),days:dimOf(d.getFullYear(),d.getMonth())}}
const catSpent=(key,c)=>vx().filter(x=>x.d.startsWith(key)&&x.c==c).reduce((s,x)=>s+x.a,0);
const bar=(p,warn)=>'<div class=bar><i class="'+(warn||'')+'" style="width:'+Math.min(100,Math.max(0,p))+'%"></i></div>';

let tab='today',cat='Food',catManual=false,editId=null,hq='',hc='All',hp='m',vm=0;
const nvItems=[['today','Today'],['history','History'],['add','Add'],['insights','Insights'],['more','More']];
function toast(msg,undo){const t=$('#toast');$('#tm').textContent=msg;t.style.display='flex';clearTimeout(t.h);t.h=setTimeout(()=>t.style.display='none',4500);const u=$('#tu');u.style.display=undo?'':'none';u.onclick=()=>{undo();t.style.display='none'}}

function vToday(){const sp=tot(td()),dl=daily(),left=dl-sp,p=dl?sp/dl*100:100,mr=monthRange(0),vs=vx().filter(x=>x.d.startsWith(mr.key)).reduce((s,x)=>s+x.a,0),sk=streak();
 const alerts=CATS.filter(c=>S.budgets[c]>0&&catSpent(mr.key,c)>=S.budgets[c]*.8).map(c=>{const u=catSpent(mr.key,c),l=S.budgets[c];return '<div class="mu '+(u>l?'bad':'')+'">'+esc(c)+': '+inr(u)+' of '+inr(l)+(u>l?' (over)':' used')+'</div>'}).join('');
 const now=new Date(),dues=S.rec.map(r=>{const due=Math.min(r.day,dimOf(now.getFullYear(),now.getMonth()));const diff=due-now.getDate();return{r,diff}}).filter(o=>o.diff>=0&&o.diff<=7).sort((a,b)=>a.diff-b.diff);
 return `<section class=card aria-label="Today"><div class=mu>Left today</div><div class="big ${left<0?'bad':''}">${inr(left)}</div>${bar(p,left<0?'r':(p>80?'w':''))}<div class=mu>Spent ${inr(sp)} of ${inr(dl)}${dl?'':' · set income in More'}</div></section>
 <section class=card><div class=stat><div><span class=mu>This month left</span><b class="${S.income-fixedTotal()-S.save-vs<0?'bad':''}">${inr(S.income-fixedTotal()-(+S.save||0)-vs)}</b></div><div><span class=mu>Streak under budget</span><b>${sk} day${sk==1?'':'s'}</b></div></div>${alerts?'<div style="margin-top:8px">'+alerts+'</div>':''}${dues.length?'<div class=mu style="margin-top:8px">Bills due: '+dues.map(o=>esc(o.r.n)+' '+inr(o.r.a)+(o.diff==0?' today':' in '+o.diff+'d')).join(', ')+'</div>':''}</section>
 <section class=card><h2>Today</h2>${vx().filter(x=>x.d==td()).reverse().map(rowHtml).join('')||'<div class=empty><svg viewBox="0 0 24 24" aria-hidden=true><rect x=3 y=6 width=18 height=13 rx=3 /><path d="M3 10h18M7 15h3"/></svg><div>No spends yet today</div><div class=mu>Tap Add to log your first one.</div></div>'}</section>`}
function rowHtml(x){return `<div class=row><button class=rowmain data-a=edit data-v="${x.id}"><span>${esc(x.n)}${x.src?'<span class=tag>SMS</span>':''}${x.rec?'<span class="tag b">Bill</span>':''}</span><div class=mu>${esc(x.c)} · ${esc(x.t)}</div></button><div class=rr><b>${inr(x.a)}</b><button class=x data-a=del data-v="${x.id}" aria-label="Delete ${esc(x.n)}">✕</button></div></div>`}
function vAdd(){const e=editId?S.tx.find(x=>x.id==editId):null;
 return `<section class=card><h2>${e?'Edit expense':'Add expense'}</h2><label for=a>Amount (₹)</label><input id=a type=number inputmode=numeric min=1 placeholder="150" value="${e?e.a:''}"><label for=n>Note</label><input id=n placeholder="Lunch, auto, recharge..." maxlength=40 value="${e?esc(e.n):''}"><label for=dt>Date</label><input id=dt type=date value="${e?e.d:td()}" max="${td()}">
 <div class=chips role=group aria-label=Category>${CATS.map(c=>`<button class="chip ${c==cat?'on':''}" data-a=pick data-v="${c}" aria-pressed="${c==cat}">${c}</button>`).join('')}</div>
 <button class=cta data-a=addsave>${e?'Save changes':'Save'}</button>${e?'<button class="cta alt" data-a=cancel>Cancel</button><button class="cta red" data-a=del data-v="'+e.id+'">Delete</button>':''}</section>
 ${e?'':`<section class=card><h2>Paste a UPI / bank SMS</h2><div class=mu>Read on this phone only. Nothing is sent anywhere.</div><label for=sms class=sr>SMS text</label><input id=sms placeholder="Rs.250.00 debited ... to SWIGGY"><button class="cta alt" data-a=sms>Read amount</button></section>`}`}
function periodTx(){const m0=monthRange(0).key,m1=monthRange(-1).key;return S.tx.filter(x=>(hp=='a'||x.d.startsWith(hp=='m'?m0:m1))&&(hc=='All'||x.c==hc)&&(!hq||(x.n+' '+x.c+' '+x.a).toLowerCase().includes(hq.toLowerCase())))}
function histList(){const l=periodTx().sort((a,b)=>(b.d+b.t).localeCompare(a.d+a.t)),by={};l.forEach(x=>(by[x.d]=by[x.d]||[]).push(x));
 const sum=l.reduce((s,x)=>s+x.a,0);
 return `<div class=mu>${l.length} entr${l.length==1?'y':'ies'} · ${inr(sum)}</div>`+(Object.keys(by).map(d=>`<div class=dh><span>${nice(d)}</span><span>${inr(by[d].reduce((s,x)=>s+x.a,0))}</span></div>`+by[d].map(rowHtml).join('')).join('')||'<div class=empty><svg viewBox="0 0 24 24" aria-hidden=true><circle cx=11 cy=11 r=6 /><path d="M20 20l-4-4"/></svg><div>No matching entries</div><div class=mu>Try another search, period or category.</div></div>')}
function vHistory(){return `<section class=card><label for=q class=sr>Search</label><input id=q type=search placeholder="Search note, category or amount" value="${esc(hq)}" autocomplete=off>
 <div class=chips role=group aria-label=Period>${[['m','This month'],['l','Last month'],['a','All']].map(([k,t])=>`<button class="chip ${hp==k?'on':''}" data-a=hp data-v=${k}>${t}</button>`).join('')}</div>
 <div class=chips role=group aria-label="Category filter">${['All',...CATS].map(c=>`<button class="chip ${hc==c?'on':''}" data-a=hc data-v="${c}">${c}</button>`).join('')}</div>
 <div id=hl>${histList()}</div></section>`}
function insights(off){const mr=monthRange(off),cur=off==0,day=cur?new Date().getDate():mr.days,v=vvx(mr.key),spent=v.reduce((s,x)=>s+x.a,0),fixedPaid=S.tx.filter(x=>x.rec&&x.d.startsWith(mr.key)).reduce((s,x)=>s+x.a,0);
 const allow=daily()*day,avg=day?spent/day:0,proj=cur?avg*mr.days:spent,limit=daily()*30;
 const big=v.slice().sort((a,b)=>b.a-a.a)[0],byc=CATS.map(c=>[c,catSpent(mr.key,c)]),top=byc.slice().sort((a,b)=>b[1]-a[1])[0];
 const wd=[0,0,0,0,0,0,0],wn=[0,0,0,0,0,0,0];v.forEach(x=>{wd[pd(x.d).getDay()]+=x.a});for(let i=1;i<=day;i++)wn[new Date(mr.y,mr.m,i).getDay()]++;
 const wa=wd.map((s,i)=>wn[i]?s/wn[i]:0),wi=wa.indexOf(Math.max(...wa));
 let under=0;for(let i=1;i<=day;i++)if(tot(mr.key+'-'+pad(i))<=daily())under++;
 const dd=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return ymd(d)}),mx=Math.max(1,daily(),...dd.map(tot)),ly=90-daily()/mx*68;
 const cm=Math.max(1,...byc.map(x=>x[1]),...CATS.map(c=>S.budgets[c]||0));
 return `<section class="card nv"><button data-a=vm data-v=-1 aria-label="Previous month">‹</button><b>${MON[mr.m]} ${mr.y}</b><button data-a=vm data-v=1 aria-label="Next month" ${off>=0?'disabled style="opacity:.3"':''}>›</button></section>
 <section class=card><div class=mu>Spent (excluding fixed bills)</div><div class=big>${inr(spent)}</div><div class=mu>${spent<=allow?'Under':'Over'} budget by ${inr(Math.abs(allow-spent))} (${inr(allow)} allowed${cur?' till today':''})</div></section>
 <section class=card><h2>Insights</h2><div class=stat><div><span class=mu>Average per day</span><b>${inr(avg)}</b></div><div><span class=mu>${cur?'Projected month':'Month total'}</span><b class="${proj>limit&&limit?'bad':''}">${inr(proj)}</b></div><div><span class=mu>Days under budget</span><b>${under} of ${day}</b></div><div><span class=mu>Fixed bills paid</span><b>${inr(fixedPaid)}</b></div></div>
 <div class=mu style="margin-top:8px">${spent?`Top category: ${top[0]} (${inr(top[1])}). Biggest: ${esc(big.n)} ${inr(big.a)}. Most spent on ${['Sundays','Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays'][wi]}.`:'No spends this month.'}${cur&&limit&&proj>limit?' At this pace you will overshoot by '+inr(proj-limit)+'.':''}</div></section>
 <section class=card><h2>Last 7 days</h2><svg viewBox="0 0 280 110" width=100% role=img aria-label="Spending in the last 7 days">${dd.map((d,i)=>{const t=tot(d),h=t/mx*68;return `<rect class=bv x="${i*40+6}" y="${90-h}" width=28 height="${Math.max(h,t?2:0)}" rx=4 fill="${t>daily()?'#c2410c':'#0f766e'}"/>${t?`<text x="${i*40+20}" y="${86-h}" font-size=9 text-anchor=middle fill="currentColor">${t>=1000?(t/1000).toFixed(1)+'k':t}</text>`:''}<text x="${i*40+20}" y=105 font-size=10 text-anchor=middle fill="currentColor">${d.slice(8)}</text>`}).join('')}<line x1=0 x2=280 y1="${ly}" y2="${ly}" stroke="currentColor" stroke-dasharray="3" opacity=".5"/></svg><div class=mu>Dashed line = daily budget</div></section>
 <section class=card><h2>By category</h2>${byc.map(([c,s])=>{const l=S.budgets[c]||0;return `<div class=cat><span>${c}</span>${bar(s/cm*100,l&&s>l?'r':(l&&s>l*.8?'w':''))}<span>${inr(s)}${l?' / '+inr(l):''}</span></div>`}).join('')}<div class=mu>Set monthly limits in More.</div></section>`}
const vvx=(k)=>vx().filter(x=>x.d.startsWith(k));
function vMore(){const g=S.goal;const dis=(S.income-fixedTotal()-(+S.save||0));
 return `<section class=card><h2>Budget</h2><label for=inc>Monthly income (₹)</label><input id=inc type=number inputmode=numeric value="${S.income||''}"><label for=fx>Other fixed bills (₹)</label><input id=fx type=number inputmode=numeric value="${S.fixed||0}"><label for=sv>Save each month (₹)</label><input id=sv type=number inputmode=numeric value="${S.save||0}">
 <div class=mu>Daily budget = (income − fixed bills − savings) ÷ 30 = <b>${inr(daily())}</b>. Fixed bills now: ${inr(fixedTotal())}.${dis<0?' <span class=bad>Costs are higher than income.</span>':''}</div><button class=cta data-a=savebudget>Save</button></section>
 <section class=card><h2>Category limits (per month)</h2>${CATS.map(c=>`<div class=inl style="align-items:center"><label for="b_${c}" style="margin:0">${c}</label><input id="b_${c}" type=number inputmode=numeric placeholder="No limit" value="${S.budgets[c]||''}"></div>`).join('')}<button class=cta data-a=savelimits>Save limits</button></section>
 <section class=card><h2>Recurring bills</h2><div class=mu>Added automatically on the due day. They are part of your fixed bills, so they do not eat the daily budget.</div>${S.rec.map((r,i)=>`<div class=row><div class=rowmain>${esc(r.n)}<div class=mu>${inr(r.a)} · day ${r.day} · ${esc(r.c)}</div></div><button class=x data-a=delrec data-v=${i} aria-label="Remove ${esc(r.n)}">✕</button></div>`).join('')}
 <label for=rn>Name</label><input id=rn placeholder="Rent, Wi-Fi, EMI" maxlength=30><div class=inl><div><label for=ra>Amount</label><input id=ra type=number inputmode=numeric></div><div><label for=rd>Day (1-31)</label><input id=rd type=number inputmode=numeric min=1 max=31></div></div>
 <label for=rc>Category</label><select id=rc>${CATS.map(c=>'<option'+(c=='Bills'?' selected':'')+'>'+c+'</option>').join('')}</select><button class="cta alt" data-a=addrec>Add bill</button></section>
 <section class=card><h2>Savings goal</h2>${g?`<div><b>${esc(g.name)}</b><div class=mu>${inr(g.saved)} of ${inr(g.target)}${(+S.save>0&&g.saved<g.target)?' · about '+Math.ceil((g.target-g.saved)/S.save)+' month(s) at '+inr(S.save)+'/month':''}</div>${bar(g.saved/g.target*100)}</div><div class=inl><input id=ga type=number inputmode=numeric placeholder="Add ₹"><button class="cta alt" style="margin:6px 0" data-a=gadd>Add savings</button></div><button class="cta red" data-a=gdel>Remove goal</button>`:`<label for=gn>Goal</label><input id=gn placeholder="New phone, laptop, trip" maxlength=30><label for=gt>Target (₹)</label><input id=gt type=number inputmode=numeric><button class=cta data-a=gset>Set goal</button>`}</section>
 <section class=card><h2>Night summary</h2><div class=mu id=nm>${NP?'Every night at 9:30 PM: spent, left, and tomorrow\'s bills. Android may move it a few minutes.':'The night notification works in the Android app. Install it from GitHub Releases.'}</div>${NP?'<button class=cta data-a=perm>Allow notifications + SMS reading</button><div class=mu id=ps style="margin-top:6px"></div>':''}</section>
 <section class=card><h2>Your data</h2><div class=mu>Stored only on this device.</div><button class=cta data-a=xlsx>Export Excel (.xlsx)</button><button class="cta alt" data-a=json>Backup (.json)</button><label for=imp class="cta alt" style="cursor:pointer">Restore backup</label><input id=imp type=file accept=".json,application/json" class=sr><button class="cta red" data-a=reset>Erase all data</button></section>
 <section class=card><div class=mu>DayLeft v${VERSION} · <a href="privacy.html" target=_blank rel=noopener>Privacy</a> · Free, no ads, no accounts.</div></section>`}
function vSetup(){return `<section class=card><h2 style="font-size:18px">Set up your budget</h2><div class=mu style="margin:4px 0 8px">Stays on this phone. Nothing is sent anywhere.</div><label for=inc>Monthly income (₹)</label><input id=inc type=number inputmode=numeric placeholder="e.g. 30000"><label for=fx>Fixed bills each month (₹)</label><input id=fx type=number inputmode=numeric placeholder="rent, EMI, recharge (0 if none)"><div class=mu id=pv style="margin-top:6px"></div><button class=cta data-a=finish>Start</button></section>`}
function view(){const m=$('#m');let h='';$('#nv').classList.toggle('hide',tab=='setup');
 h=({setup:vSetup,today:vToday,add:vAdd,history:vHistory,insights:()=>insights(vm),more:vMore})[tab]();
 document.body.classList.remove('kb');m.innerHTML=h;m.className=(tab=='history'||tab=='setup')?'one':'';m.classList.remove('enter');void m.offsetWidth;m.classList.add('enter');const sb=$('#sub');if(sb)sb.textContent=nice(td());countUp();document.querySelectorAll('#nv button').forEach(b=>{const on=b.dataset.v==(tab=='add'||editId&&tab=='add'?'add':tab);b.classList.toggle('on',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 document.title=(tab=='setup'?'Set up':tab[0].toUpperCase()+tab.slice(1))+' · DayLeft';
 if(tab=='setup'){const u=()=>{const v=((+$('#inc').value||0)-(+$('#fx').value||0))/30;$('#pv').textContent=$('#inc').value?'Daily budget: '+inr(Math.max(0,v)):''};$('#inc').oninput=$('#fx').oninput=u}
 if(tab=='add'){const n=$('#n');n.oninput=()=>{if(!catManual){const g=guess(n.value);if(g){cat=g;chips()}}};if(!editId)setTimeout(()=>{const a=$('#a');if(a)a.focus()},50)}
 if(tab=='history'){$('#q').oninput=e=>{hq=e.target.value;$('#hl').innerHTML=histList()}}
 if(tab=='more'){$('#imp').onchange=e=>imp(e.target);if(NP)NP.checkPerms().then(r=>{const e=$('#ps');if(e)e.textContent='SMS: '+r.sms+' · Notifications: '+r.notifications}).catch(()=>{})}
 window.scrollTo(0,0)}
function countUp(){const e=document.querySelector('.big');if(!e||window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return;const txt=e.textContent,v=parseInt(txt.replace(/[^0-9]/g,''),10)||0,neg=txt.trim().startsWith('-');if(v<10)return;const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/450),n=Math.round(v*(1-Math.pow(1-k,3)));e.textContent=(neg?'-':'')+'₹'+n.toLocaleString('en-IN');if(k<1)requestAnimationFrame(f);else e.textContent=txt})(t0)}
function chips(){document.querySelectorAll('[data-a=pick]').forEach(b=>{const on=b.dataset.v==cat;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on)})}
function go(t,nopush){if(t!=tab&&!nopush)history.pushState({t},'');tab=t;if(t!='add'){editId=null}view()}
window.addEventListener('popstate',e=>{const t=(e.state&&e.state.t)||'today';if(S.setup)go(t,true)});
function addSave(){const a=Math.round(+$('#a').value);if(!(a>0)){$('#a').focus();return}const n=$('#n').value.trim()||cat,d=$('#dt').value||td(),k=n.toLowerCase();
 if(editId){const x=S.tx.find(y=>y.id==editId);if(x){if(x.c!=cat&&x.src)S.learn[(x.n||'').toLowerCase()]=cat;Object.assign(x,{a,n,c:cat,d});if(catManual&&n!=cat)S.learn[k]=cat}toast('Saved')}
 else{const t=new Date();S.tx.push({id:Date.now(),n,a,c:cat,d,t:pad(t.getHours())+':'+pad(t.getMinutes())});if(catManual&&n!=cat)S.learn[k]=cat}
 editId=null;catManual=false;save();go('today')}
function parseSms(t){const m=/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)/i.exec(t);if(!m)return null;const w=/\b(?:to|at)\s+([A-Za-z][A-Za-z0-9 &._@-]{1,22}?)(?:\s+(?:via|on|ref|upi|using|from)\b|[.,;]|$)/i.exec(t);return{a:Math.round(m[1].replace(/,/g,'')),n:w?w[1].trim():''}}
function readSms(){const r=parseSms($('#sms').value);if(!r){toast('No amount found');return}$('#a').value=r.a;$('#n').value=r.n;const g=guess(r.n);if(g){cat=g;catManual=false;chips()}}
function del(id){const x=S.tx.find(y=>y.id==id);if(!x)return;S.tx=S.tx.filter(y=>y.id!=id);editId=null;save();if(tab=='add')tab='today';view();toast('Deleted '+inr(x.a),()=>{S.tx.push(x);save();view()})}
function num(id){return Math.max(0,Math.round(+$('#'+id).value||0))}
const ACT={
 finish(){const i=num('inc');if(!i){$('#inc').focus();return}S.income=i;S.fixed=num('fx');S.setup=true;save();runRecurring();go('today');toast('Daily budget '+inr(daily()))},
 pick(el){cat=el.dataset.v;catManual=true;chips()},
 addsave:addSave,cancel(){go('history')},sms:readSms,
 edit(el){const x=S.tx.find(y=>y.id==el.dataset.v);if(!x)return;editId=x.id;cat=x.c;catManual=false;tab='add';view()},
 del(el){del(el.dataset.v)},
 hp(el){hp=el.dataset.v;view()},hc(el){hc=el.dataset.v;view()},vm(el){const n=vm+Number(el.dataset.v);if(n>0)return;vm=n;view()},
 savebudget(){S.income=num('inc');S.fixed=num('fx');S.save=num('sv');save();view();toast('Saved. Daily budget '+inr(daily()))},
 savelimits(){CATS.forEach(c=>{const v=num('b_'+c);if(v)S.budgets[c]=v;else delete S.budgets[c]});save();toast('Limits saved')},
 addrec(){const n=$('#rn').value.trim(),a=num('ra'),d=Math.min(31,Math.max(1,num('rd')));if(!n||!a||!d){toast('Fill name, amount and day');return}S.rec.push({n,a,day:d,c:$('#rc').value});save();runRecurring();view();toast('Bill added')},
 delrec(el){S.rec.splice(+el.dataset.v,1);save();view()},
 gset(){const n=$('#gn').value.trim(),t=num('gt');if(!n||!t){toast('Add a name and target');return}S.goal={name:n,target:t,saved:0};save();view()},
 gadd(){const a=num('ga');if(!a)return;S.goal.saved=Math.min(S.goal.target,S.goal.saved+a);save();view();toast('Saved '+inr(a)+' towards '+S.goal.name)},
 gdel(){if(confirm('Remove this goal?')){S.goal=null;save();view()}},
 perm(){NP.requestPerms().then(()=>view()).catch(()=>{})},
 xlsx:exportXlsx,json(){out('dayleft-backup.json',new Blob([JSON.stringify(S)],{type:'application/json'}))},
 reset(){if(confirm('Erase all data on this phone?')){S=Object.assign({},DEF,{dark:S.dark,tx:[],rec:[],budgets:{},learn:{}});save();tab='setup';view()}}
};
function out(name,blob){if(NP&&NP.shareFile){const r=new FileReader();r.onload=()=>NP.shareFile({name,mime:blob.type,data:String(r.result).split(',')[1]}).catch(()=>toast('Could not share the file'));r.readAsDataURL(blob);return}
 const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
function exportXlsx(){const mr=monthRange(0),all=S.tx.slice().sort((a,b)=>(a.d+a.t).localeCompare(b.d+b.t));
 const H=['Date','Day','Time','Note','Category','Amount','Type'];
 const rows=[[{v:'DayLeft - Expense report',s:6}],[{v:'Generated '+nice(td())+' · Daily budget '+inr(daily()),s:9}],[],H.map(h=>({v:h,s:1}))];
 all.forEach(x=>rows.push([{v:x.d.split('-').reverse().join('/'),s:2},{v:DAYS[pd(x.d).getDay()],s:2},{v:x.t,s:2},{v:x.n,s:2},{v:x.c,s:2},{v:x.a,s:3},{v:x.rec?'Fixed bill':(x.src?'SMS':'Expense'),s:2}]));
 const n=all.length,first=5,last=4+n;
 rows.push([{v:'Total',s:4},{v:'',s:4},{v:'',s:4},{v:'',s:4},{v:'',s:4},{v:n?'':0,s:5,f:n?'SUM(F'+first+':F'+last+')':undefined,cv:all.reduce((s,x)=>s+x.a,0)},{v:'',s:4}]);
 if(!n)rows[rows.length-1][5]={v:0,s:5};
 const t={name:'Transactions',rows,widths:[12,7,8,30,12,13,12],freeze:4,filter:n?'A4:G'+last:null,landscape:false,titleRow:4,footer:'DayLeft expense report',heights:{3:22}};
 const sr=[[{v:'Category summary',s:6}],[{v:'Month: '+MON[mr.m]+' '+mr.y+' · fixed bills excluded from spends',s:9}],[],['Category','Spent','Monthly limit','Used'].map(h=>({v:h,s:1}))];
 const ts=[];CATS.forEach((c,i)=>{const s=catSpent(mr.key,c),l=S.budgets[c]||0;ts.push(s);sr.push([{v:c,s:2},{v:s,s:3},l?{v:l,s:3}:{v:'-',s:2},l?{v:Math.round(s/l*100)/100,s:7}:{v:'-',s:2}]) });
 sr.push([{v:'Total',s:4},{v:ts.reduce((a,b)=>a+b,0),s:5},{v:'',s:4},{v:'',s:4}]);sr.push([]);
 sr.push([{v:'Monthly income',s:2},{v:S.income,s:3}],[{v:'Fixed bills',s:2},{v:fixedTotal(),s:3}],[{v:'Planned savings',s:2},{v:+S.save||0,s:3}],[{v:'Daily budget',s:2},{v:daily(),s:3}]);
 const su={name:'Summary',rows:sr,widths:[22,14,16,10],freeze:4,titleRow:4,footer:'DayLeft category summary',heights:{3:22}};
 out('DayLeft-'+mr.key+'.xlsx',makeXlsx([t,su]));toast('Excel file ready')}
function clean(o){const t=[];(Array.isArray(o.tx)?o.tx:[]).forEach((x,i)=>{if(x&&typeof x.a=='number'&&x.a>0&&/^\d{4}-\d{2}-\d{2}$/.test(x.d))t.push({id:Number(x.id)||Date.now()+i,n:String(x.n||'').slice(0,40),a:Math.round(x.a),c:CATS.includes(x.c)?x.c:'Other',d:x.d,t:/^\d{2}:\d{2}$/.test(x.t)?x.t:'00:00',src:x.src?1:undefined,rec:x.rec?1:undefined})});
 const r=(Array.isArray(o.rec)?o.rec:[]).filter(x=>x&&x.n&&x.a>0&&x.day>=1&&x.day<=31).map(x=>({n:String(x.n).slice(0,30),a:Math.round(x.a),day:Math.round(x.day),c:CATS.includes(x.c)?x.c:'Bills',last:typeof x.last=='string'?x.last.slice(0,7):''}));
 const b={};CATS.forEach(c=>{if(o.budgets&&o.budgets[c]>0)b[c]=Math.round(o.budgets[c])});
 const g=o.goal&&o.goal.target>0?{name:String(o.goal.name||'Goal').slice(0,30),target:Math.round(o.goal.target),saved:Math.max(0,Math.round(o.goal.saved||0))}:null;
 return Object.assign({},DEF,{setup:true,income:Math.max(0,+o.income||0),fixed:Math.max(0,+o.fixed||0),save:Math.max(0,+o.save||0),tx:t,rec:r,budgets:b,goal:g,learn:{},dark:!!o.dark})}
function imp(i){const f=i.files[0];if(!f)return;f.text().then(t=>{try{const o=JSON.parse(t);if(!Array.isArray(o.tx))throw 0;S=clean(o);save();go('today');toast('Backup restored')}catch(e){toast('Not a valid DayLeft backup')}})}
function pull(){if(!NP||!S.setup)return;NP.getPending().then(r=>{let n=0;(r.items||[]).forEach(p=>{if(!(p.a>0))return;const dup=S.tx.some(x=>x.src&&x.a==p.a&&x.n==p.n&&x.d==p.d&&x.t==p.t);if(dup)return;S.tx.push({id:Date.now()+n++,n:String(p.n||'UPI debit').slice(0,40),a:Math.round(p.a),c:guess(p.n)||'Other',d:p.d,t:p.t,src:1})});if(n){save();view();toast(n+' payment'+(n>1?'s':'')+' added from SMS')}}).catch(()=>{})}
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(el&&ACT[el.dataset.a]){ACT[el.dataset.a](el)}});
$('#nv').addEventListener('click',e=>{const b=e.target.closest('button');if(b){editId=null;if(b.dataset.v=='add'){cat=cat;catManual=false}go(b.dataset.v)}});
const SUN='<svg viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round aria-hidden=true><circle cx=12 cy=12 r=4 /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',MOON='<svg viewBox="0 0 24 24" fill=none stroke=currentColor stroke-width=2 stroke-linecap=round stroke-linejoin=round aria-hidden=true><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';
const sd=()=>{document.body.classList.toggle('dark',!!S.dark);$('#th').innerHTML=S.dark?SUN:MOON;$('#th').setAttribute('aria-label',S.dark?'Switch to light theme':'Switch to dark theme');const m=document.querySelector('meta[name=theme-color]');if(m)m.content=S.dark?'#0e1411':'#0f766e'};
$('#th').onclick=()=>{S.dark=!S.dark;S.themeSet=true;try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}sd()};
const P=new URLSearchParams(location.search);
if(P.has('demo')&&!S.setup){S=Object.assign({},DEF,{setup:true,income:45000,fixed:3000,save:3000,dark:false,budgets:{Food:5000,Travel:2000,Shopping:2500},rec:[{n:'Rent',a:8000,day:1,c:'Bills',last:''},{n:'Wi-Fi',a:600,day:27,c:'Bills',last:''}],goal:{name:'New laptop',target:40000,saved:12000}});
 const r=[['Tea',20,0],['Auto',60,1],['Lunch',140,0],['Recharge',299,2],['Snacks',80,0],['Medicine',120,4]];r.forEach(([n,a,c],i)=>S.tx.push({id:i,n,a,c:CATS[c],d:td(),t:pad(8+i)+':15'}));
 [['Groceries',900,0],['Shirt',1200,3],['Petrol',500,1],['Dinner',450,0],['Bus pass',350,1],['Mess',1100,0],['Zomato',380,0],['Amazon',699,3]].forEach(([n,a,c],i)=>{const d=new Date();d.setDate(d.getDate()-1-i);S.tx.push({id:20+i,n,a,c:CATS[c],d:ymd(d),t:'20:00',src:i==6?1:undefined})})}
if(!S.setup)tab='setup';else if(P.get('tab'))tab=P.get('tab');
if(P.has('edit')&&S.tx.length){const x=S.tx[S.tx.length-1];editId=x.id;cat=x.c}
if(!S.themeSet)S.dark=!!(window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);if(P.has('dark'))S.dark=true;if(P.has('light'))S.dark=false;sd();history.replaceState({t:tab},'');runRecurring();view();sync();pull();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){runRecurring();pull();if(tab=='today')view()}});
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js');

let H0=window.innerHeight;window.addEventListener('resize',()=>{if(window.innerHeight>H0)H0=window.innerHeight;document.body.classList.toggle('kb',window.innerHeight<H0*0.75)});
