export const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Face Couture Admin</title>
<style>
:root{--plum:#2b1636;--lav:#6d3fd0;--gold:#c9a14a;--bg:#fbf7fc;--ink:#2a1f33;--muted:#7a6b88;--card:#fff;--line:#eadff0}
*{box-sizing:border-box}body{margin:0;font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;background:var(--bg);color:var(--ink)}
header{background:linear-gradient(135deg,var(--plum),#5a2a6a);color:#fff;padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
header h1{margin:0;font-size:18px;letter-spacing:.3px}header small{opacity:.8}
main{max-width:1100px;margin:0 auto;padding:18px 16px 60px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:12px 0}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:14px 16px;box-shadow:0 6px 18px -14px #2b163666}
.card h3{margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.big{font-size:28px;font-weight:700;color:var(--plum)}.sub{color:var(--muted);font-size:13px}
section{margin-top:26px}section h2{font-size:17px;margin:0 0 8px;color:var(--plum)}
table{width:100%;border-collapse:collapse;font-size:14px}td,th{padding:7px 8px;border-bottom:1px solid var(--line);text-align:left}th{color:var(--muted);font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.6px}
input,select{font:inherit;padding:8px 10px;border:1px solid #d9cbe6;border-radius:10px;background:#fff;min-width:0}
button{font:inherit;font-weight:600;padding:9px 14px;border:0;border-radius:999px;background:var(--lav);color:#fff;cursor:pointer}button.ghost{background:#fff;color:var(--lav);border:1px solid #d9cbe6}button.warn{background:#b23a48}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:8px 0}
.bar{height:10px;background:#eee4f3;border-radius:999px;overflow:hidden}.bar i{display:block;height:100%;background:linear-gradient(90deg,var(--lav),var(--gold))}
.switch{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border:1px solid var(--line);border-radius:12px;background:#fff}
#login{max-width:380px;margin:60px auto;text-align:center}.hint{font-size:13px;color:var(--muted)}
.ok{color:#2e7d4f}.bad{color:#b23a48}.pill{display:inline-block;padding:2px 9px;border-radius:999px;background:#f1e8f7;font-size:12px}
pre{background:#f7f2fb;padding:10px;border-radius:10px;overflow:auto;font-size:12px}
</style></head><body>
<header><div><h1>Face Couture · Owner dashboard</h1><small id="who">Not signed in</small></div><div class="row" style="margin:0"><select id="month"></select><button class="ghost" onclick="load()">Refresh</button><button class="ghost" onclick="logout()">Sign out</button></div></header>
<main>
<div id="login" class="card"><h2>Sign in</h2><p class="hint">Owner passphrase (set as the ADMIN_PASSPHRASE secret).</p><input id="pass" type="password" placeholder="Passphrase" style="width:100%"><div class="row" style="justify-content:center"><button onclick="login()">Sign in</button></div><p id="loginMsg" class="bad"></p></div>
<div id="app" hidden>
<div class="grid" id="kpis"></div>
<section><h2>AI spending this month</h2><div class="card"><div class="row"><div style="flex:1;min-width:200px"><div class="bar"><i id="spendBar"></i></div><div class="sub" id="spendText"></div></div>
<label>Monthly ceiling $ <input id="ceiling" type="number" min="0" step="1" style="width:90px"></label><label>Alert at % <input id="alertPct" type="number" min="1" max="100" style="width:70px"></label><button onclick="saveSpend()">Save</button></div>
<p class="hint">AI stops automatically when the ceiling is reached; everything else in the app keeps working. Failed generations never count against users or this total.</p>
<div id="projection"></div></div></section>
<section><h2>Switches</h2><div class="card"><div class="row" id="switches"></div><p class="hint">Pro switch: turning it on shows the already-reviewed subscription flow (trial first). It never charges anyone by itself. Tools can be paused one by one.</p></div></section>
<section><h2>Allowances (successful generations per user)</h2><div class="card"><table id="allow"></table><div class="row"><button onclick="saveAllow()">Save allowances</button></div></div></section>
<section><h2>Seasonal looks</h2><div class="card"><table id="seasons"></table><div class="row"><button onclick="saveSeasons()">Save seasons</button><span class="hint">Dates are month-day, inclusive, repeat yearly, in each viewer's local time zone.</span></div></div></section>
<section><h2>Promo codes</h2><div class="card"><table id="promos"></table><div class="row"><input id="pcode" placeholder="CODE" style="text-transform:uppercase"><select id="pkind"><option value="ai">Extra AI allowance</option><option value="pro">Pro access</option></select><input id="pdays" type="number" value="14" style="width:80px" title="days"><input id="pmax" type="number" value="50" style="width:80px" title="max uses"><input id="pexp" type="date"><button onclick="addPromo()">Create</button></div>
<p class="hint">These codes are redeemed inside the app (Settings → Promo code) and give AI allowance or Pro access without going through the stores. Store offer codes (Apple Offer Codes / Google Play promo codes) are created in App Store Connect and Play Console; see the handover notes.</p></div></section>
<section><h2>Hidden looks</h2><div class="card"><div class="row"><input id="hidden" placeholder="comma-separated look keys, e.g. hw_vampire, rl_princess" style="flex:1"><button onclick="saveHidden()">Save</button></div><p class="hint">Hidden looks disappear from every app and the website within a minute, no store update needed.</p></div></section>
<section><h2>Manual override</h2><div class="card"><div class="row"><input id="gdev" placeholder="device id (from the user's Settings screen)" style="flex:1"><select id="gkind"><option value="pro">Pro</option><option value="ai">AI allowance</option></select><input id="gdays" type="number" value="30" style="width:80px"><button onclick="grant()">Grant</button></div></div></section>
<section><h2>What people use</h2><div class="grid"><div class="card"><h3>Top looks</h3><table id="looks"></table></div><div class="card"><h3>Events</h3><table id="events"></table></div><div class="card"><h3>Campaign links</h3><table id="camps"></table><p class="hint">Use links like facecouture.app/?c=tiktok_oct</p></div><div class="card"><h3>Countries</h3><table id="geo"></table></div></div></section>
<section><h2>Reports from users</h2><div class="card"><table id="reports"></table></div></section>
<section><h2>Settings history</h2><div class="card"><div class="row" id="versions"></div><p class="hint">Every save is a version. Roll back restores it as a new version.</p></div></section>
</div></main>
<script>
const api=(p,o={})=>fetch('/api/admin/'+p,{...o,headers:{'content-type':'application/json',authorization:'Bearer '+(localStorage.fcAdmin||''),...(o.headers||{})}}).then(async r=>{const j=await r.json().catch(()=>({}));if(r.status===401){logout();throw new Error('Signed out')}if(!r.ok)throw new Error(j.error||'Failed');return j});
let CFG=null;
function logout(){localStorage.removeItem('fcAdmin');document.getElementById('app').hidden=true;document.getElementById('login').hidden=false;document.getElementById('who').textContent='Not signed in'}
async function login(){try{const j=await fetch('/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({passphrase:document.getElementById('pass').value})}).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);return j});localStorage.fcAdmin=j.token;load()}catch(e){document.getElementById('loginMsg').textContent=e.message}}
function monthOpts(){const s=document.getElementById('month');if(s.options.length)return;const d=new Date();for(let i=0;i<12;i++){const m=new Date(d.getFullYear(),d.getMonth()-i,1).toISOString().slice(0,7);s.add(new Option(m,m))}s.onchange=load}
function kpi(t,v,s){return '<div class="card"><h3>'+t+'</h3><div class="big">'+v+'</div><div class="sub">'+(s||'')+'</div></div>'}
function tbl(el,rows,head){document.getElementById(el).innerHTML=(head?'<tr>'+head.map(h=>'<th>'+h+'</th>').join('')+'</tr>':'')+rows.map(r=>'<tr>'+r.map(c=>'<td>'+c+'</td>').join('')+'</tr>').join('')||'<tr><td class="sub">Nothing yet</td></tr>'}
async function load(){monthOpts();if(!localStorage.fcAdmin)return;try{const m=document.getElementById('month').value;const [o,c]=await Promise.all([api('overview?month='+m),api('config')]);CFG=c.config;render(o,c)}catch(e){if(e.message!=='Signed out')alert(e.message)}}
function render(o,c){document.getElementById('login').hidden=true;document.getElementById('app').hidden=false;document.getElementById('who').textContent='Signed in · settings v'+c.config.version;
document.getElementById('kpis').innerHTML=kpi('Devices (all time)',o.users.registeredDevices,'iOS '+o.users.installs.ios+' · Android '+o.users.installs.android+' · web '+o.users.installs.web+' new this month')+kpi('Active today',o.users.dau)+kpi('Active this month',o.users.mau)+kpi('AI generations',o.ai.generations,'avg '+o.ai.avgSeconds+'s · failed '+(o.ai.failures.provider+o.ai.failures.timeout)+' · blocked by ceiling '+o.ai.blockedByCeiling)+kpi('Trials / purchases',o.subscriptions.trials+' / '+o.subscriptions.purchases,'renewals '+o.subscriptions.renewals+' · cancels '+o.subscriptions.cancellations+' · refunds '+o.subscriptions.refunds)+kpi('Gross revenue','$'+o.revenue.gross,'est. net after store fee and AI: $'+o.revenue.netEstimate)+kpi('AI spend','$'+o.spend.usd,'$'+o.spend.perGenAvg+' per generation');
document.getElementById('spendBar').style.width=Math.min(100,o.spend.percent)+'%';document.getElementById('spendText').textContent='$'+o.spend.usd+' of $'+o.spend.ceiling+' ('+o.spend.percent+'%)'+(o.alerts.provider?' · provider alert: '+o.alerts.provider:'');
document.getElementById('ceiling').value=c.config.spend.monthlyCeilingUSD;document.getElementById('alertPct').value=c.config.spend.alertAtPercent;
document.getElementById('projection').innerHTML='<p class="hint">Cost projection ('+o.costProjection.assumptions+')</p><table><tr><th>Active users</th><th>If everyone is free</th><th>If 10% are paid</th></tr>'+o.costProjection.rows.map(r=>'<tr><td>'+r.activeUsers+'</td><td>$'+r.ifAllFree+'/mo</td><td>$'+r.if10pctPaid+'/mo</td></tr>').join('')+'</table>';
const sw=document.getElementById('switches');sw.innerHTML='<label class="switch"><b>Paywall turns on</b> <input type="date" value="'+(c.config.pro.paywallFrom||'')+'" onchange="patch({pro:{paywallFrom:this.value}})"> <span class="hint">Empty = free launch (no paywall). Set to 30 days after launch.</span></label>'+Object.entries(c.config.tools).map(([k,v])=>'<label class="switch"><input type="checkbox" '+(v?'checked':'')+' onchange="patch({tools:{'+k+':this.checked}})"> '+k+'</label>').join('')+'<label class="switch"><input type="checkbox" '+(c.config.flags.showQuiz?'checked':'')+' onchange="patch({flags:{showQuiz:this.checked}})"> Quiz</label>';
tbl('allow',Object.entries(c.config.allowances).map(([t,a])=>[t,'<input data-a="'+t+'.perDay" type="number" value="'+a.perDay+'" style="width:80px">','<input data-a="'+t+'.perMonth" type="number" value="'+a.perMonth+'" style="width:80px">']),['Tier','Per day','Per month']);
tbl('seasons',Object.entries(c.config.seasons).map(([k,s])=>[k,'<input data-s="'+k+'.from" value="'+s.from+'" style="width:80px">','<input data-s="'+k+'.to" value="'+s.to+'" style="width:80px">','<input type="checkbox" data-s="'+k+'.enabled" '+(s.enabled?'checked':'')+'>']),['Season','From (MM-DD)','To (MM-DD)','On']);
tbl('promos',Object.entries(c.config.promos).map(([k,p])=>[k,p.kind,p.days+' days',(p.uses||0)+' / '+(p.maxUses||'∞'),p.expires||'—','<button class="ghost" onclick="delPromo(\\''+k+'\\')">Delete</button>']),['Code','Gives','Length','Used','Expires','']);
document.getElementById('hidden').value=(c.config.looks.hidden||[]).join(', ');
tbl('looks',o.topLooks.map(([k,n])=>[k,n]));tbl('events',Object.entries(o.events).map(([k,n])=>[k,n]));tbl('camps',Object.entries(o.campaigns).map(([k,n])=>[k,n]));tbl('geo',Object.entries(o.countries).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([k,n])=>[k,n]));
api('reports').then(r=>tbl('reports',r.reports.filter(Boolean).map(x=>[new Date(x.at).toLocaleString(),x.task,x.reason]),['When','Tool','Report'])).catch(()=>{});
document.getElementById('versions').innerHTML=c.versions.map(v=>'<button class="ghost" onclick="rollback('+v+')">v'+v+(v===c.config.version?' (current)':'')+'</button>').join('');}
async function patch(p){await api('config',{method:'POST',body:JSON.stringify(p)});load()}
function saveSpend(){patch({spend:{monthlyCeilingUSD:+document.getElementById('ceiling').value,alertAtPercent:+document.getElementById('alertPct').value}})}
function saveAllow(){const a={};document.querySelectorAll('[data-a]').forEach(i=>{const [t,k]=i.dataset.a.split('.');(a[t]=a[t]||{})[k]=+i.value});patch({allowances:a})}
function saveSeasons(){const s={};document.querySelectorAll('[data-s]').forEach(i=>{const [t,k]=i.dataset.s.split('.');(s[t]=s[t]||{})[k]=i.type==='checkbox'?i.checked:i.value});patch({seasons:s})}
function saveHidden(){patch({looks:{hidden:document.getElementById('hidden').value.split(',').map(s=>s.trim()).filter(Boolean)}})}
async function addPromo(){await api('promo',{method:'POST',body:JSON.stringify({code:pcode.value,kind:pkind.value,days:pdays.value,maxUses:pmax.value,expires:pexp.value})});load()}
async function delPromo(c){if(confirm('Delete code '+c+'?')){await api('promo/delete',{method:'POST',body:JSON.stringify({code:c})});load()}}
async function rollback(v){if(confirm('Restore settings version '+v+'?')){await api('config/rollback',{method:'POST',body:JSON.stringify({version:v})});load()}}
async function grant(){await api('grant',{method:'POST',body:JSON.stringify({device:gdev.value.trim(),kind:gkind.value,days:+gdays.value})});alert('Granted')}
load();
</script></body></html>`;
