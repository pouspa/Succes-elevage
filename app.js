const KEY='mon_poulailler_vide_v2',today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const def=()=>({cat:[],stock:{d:0,c:0,p:0},ventes:[],dep:[],distributions:[],obj:500000,day:today(),prev:null})
let A=null;try{A=JSON.parse(localStorage.getItem(KEY))}catch(e){}
if(!A||!A.cat)A=def();
if(!A.stock)A.stock={d:0,c:0,p:0};
if(!Array.isArray(A.distributions))A.distributions=[];
for(const c of A.cat){if(!c.f)c.f='c';if(!Number.isFinite(c.g))c.g=50;}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(A))}catch(e){}};
const U={tab:'home',type:'mort',catFeedEdit:null};
const F={d:'Démarrage',c:'Croissance',p:'Entretien / ponte'};
const fmt=n=>Math.round(n).toLocaleString('fr-FR').replace(/[\u202f\u00a0]/g,' ')+' FCFA';
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const total=()=>sum(A.cat,c=>c.q),morts=()=>sum(A.cat,c=>c.m);
const conso=k=>sum((A.distributions||[]).filter(x=>x.f===k&&x.date===today()),x=>x.kg);
const jours=k=>{const d=conso(k);return d?Math.floor((Number(A.stock[k])||0)/d):99};
const V=()=>sum(A.ventes,x=>x.m),D=()=>sum(A.dep,x=>x.m);
const nonVac=c=>Math.max(0,c.q-c.vac-c.tr);
const dec=n=>n.toFixed(1).replace('.',',');
const ageTxt=date=>{if(!date)return 'Date non renseignée';const n=Math.floor((Date.parse(today())-Date.parse(date))/864e5);if(!Number.isFinite(n)||n<0)return 'Date invalide';const w=Math.floor(n/7),d=n%7;return n===0?'0 jour':n<7?`${n} jour(s)`:`${w} semaine(s)${d?' et '+d+' jour(s)':''} (${n} jours)`;};
// Le stock ne diminue que lorsqu’une distribution réelle est enregistrée.
const tabs=[['home','🏠','Accueil'],['cheptel','🐔','Cheptel'],['aliment','🌾','Aliment'],['sante','💉','Santé'],['argent','💰','Finance'],['rapport','📋','Rapport']];

function alerts(){const a=[];
for(const k of ['d','c','p']){const daily=conso(k);if(!daily)continue;const j=jours(k);if(j<=21)a.push([j<=10?'r':'',`Stock ${F[k].toLowerCase()} : ${j<=0?'épuisé':'environ '+j+' jours au rythme enregistré'}.`]);}
const nv=sum(A.cat,nonVac);if(nv>0)a.push(['',`${nv} sujets pas encore vaccinés.`]);
if(morts()>0){const mp=morts()/(total()+morts())*100;a.push([mp>8?'r':'',`Mortalité : ${morts()} morts (${dec(mp)} %).`]);}
return a;}
const alertsHtml=()=>alerts().map(x=>`<div class="alert ${x[0]}">${x[1]}</div>`).join('')||'<div class="sub">Rien à signaler.</div>';

function home(){const v=V(),p=Math.min(100,v/A.obj*100),jm=Math.min(...['d','c','p'].filter(k=>conso(k)).map(jours),99);
return `<h1>Mon Élevage Avicole</h1><div class="sub">Tableau de bord</div>
<div class="hero" style="margin-top:12px"><div class="sub">Ventes vers l’objectif du 25 décembre</div><div class="big">${fmt(v)}</div>
<div class="bar"><i style="width:${p}%"></i></div><div class="sub">${p.toFixed(0)} % de ${fmt(A.obj)}</div></div>
<h2>À surveiller</h2>${alertsHtml()}
<h2>En un coup d’œil</h2><div class="grid">
<div class="stat"><span class="sub">🐔 Cheptel</span><b>${total()}</b><span class="sub">volailles</span></div>
<div class="stat"><span class="sub">🌾 Aliment</span><b>${jm} j</b><span class="sub">stock le plus bas</span></div>
<div class="stat"><span class="sub">💉 À vacciner</span><b>${sum(A.cat,nonVac)}</b><span class="sub">${sum(A.cat,c=>c.tr)} en traitement</span></div>
<div class="stat"><span class="sub">💰 Finance</span><b style="color:${V()-D()<0?'var(--red)':'var(--g)'}">${fmt(V()-D())}</b><span class="sub">ventes − dépenses</span></div></div>
${A.prev?'<button class="ghost" id="undo" style="margin-top:16px">↶ Annuler la dernière saisie</button>':''}`;}

function cheptel(){return `<h1>Mon cheptel</h1><div class="sub">${total()} volailles vivantes</div><h2>Par catégorie</h2><div class="card">`+
A.cat.map(c=>`<div class="row"><div><div class="n">${c.e} ${c.n}</div><div class="sub">Aliment : ${F[c.f]||F.c} · ${c.m?c.m+' mort(s)':'aucune mort'}</div><div class="sub">Date de naissance / arrivée : ${c.date||'non renseignée'} · Âge : ${ageTxt(c.date)}</div></div><span class="pill p-g" style="font-size:18px">${c.q}</span></div>`).join('')+
`</div><div class="sub">Touchez + pour noter une mort, une naissance, un achat…</div>`;}

function aliment(){
 const eau=sum(A.cat,c=>c.q*c.g)/1000*2;
 const todayDist=sum((A.distributions||[]).filter(x=>x.date===today()),x=>x.kg);
 const history=(A.distributions||[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,15).map(x=>{const c=A.cat.find(c=>c.id===x.cat);return `<div class="row"><div><div class="n">${c?c.n:'Catégorie inconnue'} · ${x.date}</div><div class="sub">${F[x.f]||x.f}</div></div><button class="ghost" data-dist-history="${x.id}" style="width:auto;margin:0;padding:8px">${dec(x.kg)} kg · Modifier</button></div>`}).join('');
 return `<h1>Aliment</h1><div class="sub">Le stock suit les quantités réellement données et enregistrées. Aucune baisse automatique sans saisie.</div><h2>Stocks disponibles</h2>`+
 ['d','c','p'].map(k=>`<div class="card"><div class="row" style="border:0;padding:0"><div><div class="n">${F[k]}</div><div class="sub">${dec(Number(A.stock[k]||0))} kg disponibles · ${dec(conso(k))} kg distribués aujourd’hui</div></div><button class="ghost" data-stock-edit="${k}" style="width:auto;margin:0;padding:8px">Corriger</button></div></div>`).join('')+
 `<h2>Quantités réellement données aujourd’hui</h2><div class="card">`+
 A.cat.map(c=>{const d=(A.distributions||[]).find(x=>x.date===today()&&x.cat===c.id);return `<div class="row"><div><div class="n">${c.e} ${c.n}</div><div class="sub">${F[c.f]||F.c} · ration indicative ${c.g} g/sujet/jour</div><div class="sub">Saisie réelle aujourd’hui : ${d?dec(d.kg)+' kg':'pas encore saisie'}</div></div><button class="ghost" data-dist-edit="${c.id}" style="width:auto;margin:0;padding:8px">${d?'Modifier':'Saisir'}</button></div>`}).join('')+
 (A.cat.length?'':'<div class="sub">Créez d’abord une catégorie de volailles.</div>')+
 `<div class="row"><div><div class="n">Total distribué aujourd’hui</div><div class="sub">Toutes catégories confondues</div></div><b>${dec(todayDist)} kg</b></div></div><h2>Dernières distributions</h2><div class="card">`+
 (history||'<div class="sub">Aucune distribution enregistrée.</div>')+
 `</div><div class="sub">Vous pouvez modifier une quantité à tout moment, y compris pour une date passée. La correction ajuste le stock uniquement de la différence, sans double déduction. La ration par sujet reste indicative.</div>`;
}

function sante(){return `<h1>Santé</h1><div class="sub">Vaccinés, à vacciner, en traitement</div><h2>Par catégorie</h2>`+
A.cat.map(c=>{const n=nonVac(c),w=c.q?100/c.q:0;return `<div class="card"><div class="n">${c.e} ${c.n}</div>
<div class="seg"><i style="width:${c.vac*w}%;background:var(--g)"></i><i style="width:${c.tr*w}%;background:var(--red)"></i></div>
<div style="margin-top:8px"><span class="pill p-g">${c.vac} vaccinés</span> <span class="pill p-a">${n} à vacciner</span> <span class="pill p-r">${c.tr} en traitement</span></div></div>`}).join('')+
`<div class="sub">Touchez + puis « Vaccin fait » ou « Traitement » pour mettre à jour.</div>`;}

function argent(){const b=V()-D(),li=a=>a.slice().reverse().map(x=>`<div class="row"><span>${x.l}</span><b>${fmt(x.m)}</b></div>`).join('')||'<div class="sub">Aucune saisie.</div>';
const by=A.dep.reduce((o,x)=>(o[x.l]=(o[x.l]||0)+x.m,o),{});
return `<h1>Finance</h1><div class="sub">Ventes, dépenses, bénéfice</div>
<div class="grid" style="margin-top:12px"><div class="stat"><span class="sub">Ventes</span><b style="color:var(--g)">${fmt(V())}</b></div><div class="stat"><span class="sub">Dépenses</span><b style="color:var(--red)">${fmt(D())}</b></div></div>
<div class="card" style="margin-top:10px"><div class="sub">Bénéfice</div><div class="big" style="color:${b<0?'var(--red)':'var(--g)'}">${fmt(b)}</div></div>
<h2>Ventes</h2><div class="card">${li(A.ventes)}</div>
<h2>Dépenses par type</h2><div class="card">${Object.entries(by).map(([k,m])=>`<div class="row"><span>${k} <span class="sub">${Math.round(D()?m/D()*100:0)} %</span></span><b>${fmt(m)}</b></div>`).join('')||'<div class="sub">Aucune dépense.</div>'}</div>
<h2>Dernières dépenses</h2><div class="card">${li(A.dep)}</div>`;}

function repText(){return `RAPPORT GÉNÉRAL – Mon Élevage Avicole (${today()})
Cheptel : ${total()} volailles (${A.cat.map(c=>c.q+' '+c.n.toLowerCase()).join(', ')})
Mortalité : ${morts()} morts
Stocks restants : démarrage ${dec(A.stock.d)} kg, croissance ${dec(A.stock.c)} kg, entretien/ponte ${dec(A.stock.p)} kg
Distribué aujourd’hui : ${dec(sum((A.distributions||[]).filter(x=>x.date===today()),x=>x.kg))} kg
Santé : ${sum(A.cat,c=>c.vac)} vaccinés, ${sum(A.cat,nonVac)} à vacciner, ${sum(A.cat,c=>c.tr)} en traitement
Ventes : ${fmt(V())}
Dépenses : ${fmt(D())}
Bénéfice : ${fmt(V()-D())}
Objectif ${fmt(A.obj)} : ${(V()/A.obj*100).toFixed(0)} %`;}

function rapport(){const t=repText();
return `<h1>Rapport général</h1><div class="sub">Résumé de l’élevage</div><h2>À surveiller</h2>${alertsHtml()}
<h2>Résumé</h2><div class="card rep">${t}</div>
<a class="ghost" style="background:var(--g);color:#fff;border:0" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(t)}">Partager par WhatsApp</a>
<button class="ghost" id="copy">Copier le rapport</button>
<button class="ghost" id="reset" style="color:var(--red);margin-top:28px">Tout remettre à zéro</button>`;}

function render(){const m={home,cheptel,aliment,sante,argent,rapport};
document.getElementById('app').innerHTML=m[U.tab]();
document.getElementById('nav').innerHTML=tabs.map(t=>`<button class="${U.tab===t[0]?'on':''}" data-t="${t[0]}"><span>${t[1]}</span>${t[2]}</button>`).join('');
const $=id=>document.getElementById(id);
if($('copy'))$('copy').onclick=()=>{try{navigator.clipboard.writeText(repText()).then(()=>$('copy').textContent='Copié ✓')}catch(e){$('copy').textContent='Copie impossible'}};
if($('undo'))$('undo').onclick=()=>{A=JSON.parse(A.prev);save();render();};
if($('reset'))$('reset').onclick=()=>{if(confirm('Effacer toutes les données ?')){A=def();save();render();}};
$('app').querySelectorAll('[data-ration-edit]').forEach(b=>b.onclick=()=>{U.type='ration';U.rationEdit=b.dataset.rationEdit;form();document.getElementById('sheet').classList.add('open');});
$('app').querySelectorAll('[data-catfeed-edit]').forEach(b=>b.onclick=()=>{U.type='catfeed';U.catFeedEdit=b.dataset.catfeedEdit;form();document.getElementById('sheet').classList.add('open');});
$('app').querySelectorAll('[data-dist-edit]').forEach(b=>b.onclick=()=>{U.type='distribution';U.distributionEditId=null;U.distDate=today();form();document.getElementById('f1').value=b.dataset.distEdit;const old=(A.distributions||[]).find(x=>x.date===today()&&x.cat===b.dataset.distEdit);document.getElementById('f2').value=old?old.kg:'';document.getElementById('fDistDate').value=today();document.getElementById('sheet').classList.add('open');});
$('app').querySelectorAll('[data-dist-history]').forEach(b=>b.onclick=()=>{const x=(A.distributions||[]).find(x=>x.id===b.dataset.distHistory);if(!x)return;U.type='distribution';U.distributionEditId=x.id;U.distDate=x.date;form();document.getElementById('f1').value=x.cat;document.getElementById('f2').value=x.kg;document.getElementById('fDistDate').value=x.date;document.getElementById('sheet').classList.add('open');});
$('app').querySelectorAll('[data-stock-edit]').forEach(b=>b.onclick=()=>{U.type='stockset';form();document.getElementById('f1').value=b.dataset.stockEdit;document.getElementById('f2').value=Number(A.stock[b.dataset.stockEdit]||0);document.getElementById('sheet').classList.add('open');});
scrollTo(0,0);}
document.getElementById('nav').onclick=e=>{const b=e.target.closest('button');if(b){U.tab=b.dataset.t;render();}};

const TYPES=[['catadd','Créer une catégorie'],['datecat','Modifier date et âge'],['catfeed','Type d’aliment par catégorie'],['ration','Programme de nutrition'],['distribution','Quantité réellement distribuée'],['transfert','Changer de catégorie'],['mort','Mort'],['entree','Naissance ou achat'],['vente','Vente'],['dep','Dépense'],['feed','Aliment reçu'],['stockset','Corriger le stock'],['sortie','Sortie / perte'],['vac','Vaccin fait'],['trait','Traitement']];
function form(){const t=U.type;
const cats=A.cat.map(c=>[c.id,c.n]);
const O={distribution:cats,catadd:[['new','Nouvelle catégorie']],datecat:cats,catfeed:cats,ration:cats,transfert:cats,mort:cats,entree:cats,vac:cats,trait:cats,vente:['Œufs','Poulets','Pintades','Autre'].map(x=>[x,x]),dep:['Aliment','Médicaments','Matériel','Transport','Main-d’œuvre','Autre'].map(x=>[x,x]),feed:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']],stockset:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']],sortie:[['d','Démarrage'],['c','Croissance'],['p','Ponte / entretien']]};
const L={distribution:['Catégorie','Quantité réellement donnée (kg)'],catadd:['Nom de la catégorie','Nombre initial de volailles'],datecat:['Catégorie','Nouvelle date de naissance / arrivée'],catfeed:['Catégorie','Type d’aliment'],ration:['Catégorie','Ration par volaille et par jour (grammes)'],transfert:['Catégorie de départ','Nombre de volailles à déplacer'],mort:['Catégorie','Nombre de morts'],entree:['Catégorie','Nombre ajouté'],vente:['Type de vente','Montant (FCFA)'],dep:['Type de dépense','Montant (FCFA)'],feed:['Aliment reçu','Quantité (kg)'],stockset:['Type d’aliment à corriger','Nouveau stock réel (kg)'],sortie:['Type d’aliment concerné','Quantité sortie / perdue (kg)'],vac:['Catégorie','Nombre vaccinés (en plus)'],trait:['Catégorie','Nombre en traitement (0 si guéris)']};
const noCat=['datecat','ration','transfert','mort','entree','vac','trait'].includes(t)&&A.cat.length< (t==='transfert'?2:1);
document.getElementById('form').innerHTML=`<h2 style="margin-top:0">${t==='ration'?'Modifier la ration':t==='catfeed'?'Modifier le type d’aliment':'Nouvelle saisie'}</h2>
<label>Que voulez-vous noter ?</label><select id="ft">${TYPES.map(x=>`<option value="${x[0]}" ${x[0]===t?'selected':''}>${x[1]}</option>`).join('')}</select>
${t==='catadd'?`<label>${L[t][0]}</label><input id="fcat" type="text" maxlength="50" placeholder="Ex. Poulets de chair">`:`<label>${L[t][0]}</label><select id="f1">${(O[t]||[]).map(x=>`<option value="${x[0]}" ${((t==='ration'&&U.rationEdit===x[0])||(t==='catfeed'&&U.catFeedEdit===x[0])||(t==='distribution'&&((A.distributions||[]).find(z=>z.id===U.distributionEditId)?.cat===x[0])))?'selected':''}>${x[1]}</option>`).join('')}</select>`}
${t==='catadd'?`<label>Date de naissance / arrivée des volailles</label><input id="fDate" type="date" value="${today()}"><div class="sub">Cette date sert à calculer l’âge de la catégorie.</div><label>Type d’aliment attribué à cette catégorie</label><select id="fFeed"><option value="d">Démarrage</option><option value="c" selected>Croissance</option><option value="p">Entretien</option></select>`:''}
${t==='distribution'?`<label>Date de distribution</label><input id="fDistDate" type="date" max="${today()}" value="${U.distDate||today()}"><div class="sub">Une correction passée ajuste le stock de la différence.</div>`:''}
${t==='datecat'?`<label>Nouvelle date de naissance / arrivée</label><input id="fDate" type="date" value="${today()}"><div class="sub">L’âge est calculé à partir de cette date. Pour des volailles d’âges différents, crée des catégories séparées.</div>`:''}
${t==='catfeed'?`<label>Nouveau type d’aliment</label><select id="fFeed"><option value="d">Démarrage</option><option value="c">Croissance</option><option value="p">Entretien</option></select><div class="sub">Le changement s’applique à toute la catégorie sélectionnée.</div>`:''}
${t==='transfert'?`<label>Catégorie d’arrivée</label><select id="fDest">${cats.map(x=>`<option value="${x[0]}">${x[1]}</option>`).join('')}</select><div class="sub">Les volailles seront retirées de la catégorie de départ et ajoutées à celle d’arrivée.</div>`:''}
${t==='datecat'?'':`<label>${L[t][1]}</label><input id="f2" type="number" inputmode="decimal" min="0" step="${['feed','ration','stockset','sortie'].includes(t)?'0.1':'1'}" value="${t==='ration'?(A.cat.find(c=>c.id===(U.rationEdit||A.cat[0]?.id))?.g??''):''}" placeholder="${['feed','stockset','sortie'].includes(t)?'Ex. 25':t==='ration'?'Ex. 120':t==='dep'||t==='vente'?'Ex. 15000':'0'}">`}
${noCat?`<div class="alert">Crée d’abord une catégorie de volailles avant d’enregistrer cette opération.</div>`:''}
<button class="ok" id="save">Enregistrer</button><button class="ghost" id="cancel">Annuler</button>`;
document.getElementById('ft').onchange=e=>{U.type=e.target.value;U.rationEdit=null;U.distributionEditId=null;U.distDate=today();form();};
if(t==='ration'&&document.getElementById('f1'))document.getElementById('f1').onchange=e=>{U.rationEdit=e.target.value;form();};
if(t==='datecat'&&document.getElementById('f1'))document.getElementById('f1').onchange=e=>{const c=A.cat.find(x=>x.id===e.target.value);const d=document.getElementById('fDate');if(d)d.value=c?.date||today();};
if(t==='catfeed'&&document.getElementById('f1'))document.getElementById('f1').onchange=e=>{U.catFeedEdit=e.target.value;form();};
if(t==='catfeed'&&document.getElementById('fFeed')){const cc=A.cat.find(x=>x.id===document.getElementById('f1')?.value);document.getElementById('fFeed').value=cc?.f||'c';}
document.getElementById('cancel').onclick=close;
document.getElementById('save').onclick=()=>{
const raw=document.getElementById('f2')?.value??'';
const v=Number(String(raw).trim().replace(',', '.')),s=document.getElementById('f1')?.value;
if(t==='distribution'){const cc=A.cat.find(x=>x.id===s),dt=document.getElementById('fDistDate')?.value||today();if(!cc){alert('Choisissez une catégorie valide.');return;}if(!dt||dt>today()){alert('Choisissez une date valide, aujourd’hui ou antérieure.');return;}if(raw===''||!Number.isFinite(v)||v<0){document.getElementById('f2').focus();return;}const old=U.distributionEditId?(A.distributions||[]).find(x=>x.id===U.distributionEditId):(A.distributions||[]).find(x=>x.date===dt&&x.cat===cc.id);const oldKg=old?(Number(old.kg)||0):0,food=cc.f||'c',delta=v-oldKg;if(delta>0&&delta>(Number(A.stock[food])||0)){alert(`Stock insuffisant en ${F[food]}. Disponible : ${dec(Number(A.stock[food]||0))} kg.`);return;}const snap=JSON.stringify({...A,prev:null});if(old){old.kg=v;old.f=food;old.date=dt;}else{A.distributions.push({id:'dist_'+Date.now().toString(36),cat:cc.id,f:food,kg:v,date:dt});}A.stock[food]=Math.max(0,(Number(A.stock[food])||0)-delta);A.prev=snap;save();U.distributionEditId=null;U.distDate=null;close();render();return;}
if(t==='datecat'){const cDate=A.cat.find(c=>c.id===s),dt=document.getElementById('fDate')?.value;if(!cDate||!dt||dt>today()){alert('Choisissez une date valide, aujourd’hui ou antérieure.');return;}const snap=JSON.stringify({...A,prev:null});cDate.date=dt;A.prev=snap;save();close();render();return;}
if(t==='catadd'){
 const name=(document.getElementById('fcat').value||'').trim();
 if(!name){document.getElementById('fcat').focus();return;}
 if(raw===''||!Number.isFinite(v)||v<0||!Number.isInteger(v)){document.getElementById('f2').focus();return;}
 if(A.cat.some(c=>c.n.toLocaleLowerCase()===name.toLocaleLowerCase())){alert('Cette catégorie existe déjà.');return;}
 const snap=JSON.stringify({...A,prev:null});
 const id='cat_'+Date.now().toString(36);
 const food=document.getElementById('fFeed')?.value||'c';
 const date=document.getElementById('fDate')?.value||today();if(date>today()){alert('La date ne peut pas être dans le futur.');return;}A.cat.push({id,n:name,e:'🐔',q:v,g:50,vac:0,tr:0,f:food,m:0,date});
 A.prev=snap;save();close();render();return;
}
if(!Number.isFinite(v)||raw===''||v<0||(!['trait','feed','ration','stockset','sortie','distribution'].includes(t)&&!Number.isInteger(v))||(!['trait','stockset','distribution'].includes(t)&&v===0)){document.getElementById('f2').focus();return;}
const snap=JSON.stringify({...A,prev:null}),c=A.cat.find(x=>x.id===s);
if(['datecat','catfeed','ration','mort','entree','vac','trait','transfert'].includes(t)&&!c){alert('Créez d’abord une catégorie de volailles.');return;}
if(t==='catfeed'){c.f=document.getElementById('fFeed')?.value||'c';}
else if(t==='transfert'){const destId=document.getElementById('fDest')?.value;const dest=A.cat.find(x=>x.id===destId);if(!dest||dest.id===c.id){alert('Choisissez une catégorie d’arrivée différente de la catégorie de départ.');return;}if(v<=0||v>c.q){alert(`Transfert impossible : ${c.n} contient ${c.q} volaille(s).`);return;}c.q-=v;dest.q+=v;c.tr=Math.min(c.tr,c.q);c.vac=Math.min(c.vac,c.q-c.tr);dest.tr=Math.min(dest.tr,dest.q);dest.vac=Math.min(dest.vac,dest.q-dest.tr);}
else if(t==='ration'){c.g=v;}
else if(t==='mort'){const n=Math.min(v,c.q);c.q-=n;c.m+=n;c.tr=Math.min(c.tr,c.q);c.vac=Math.min(c.vac,c.q-c.tr);}
else if(t==='entree')c.q+=v;
else if(t==='vac')c.vac=Math.min(c.q-c.tr,c.vac+v);
else if(t==='trait'){c.tr=Math.min(c.q,v);c.vac=Math.min(c.vac,c.q-c.tr);}
else if(t==='feed')A.stock[s]+=v;
else if(t==='stockset')A.stock[s]=v;
else if(t==='sortie'){if(v>A.stock[s]){alert(`Sortie impossible : le stock ${F[s]} disponible est de ${dec(A.stock[s])} kg.`);return;}A.stock[s]=Math.max(0,A.stock[s]-v);}
else if(t==='vente')A.ventes.push({l:s,m:v,date:today()});
else A.dep.push({l:s,m:v,date:today()});
A.prev=snap;save();close();render();};}
function close(){document.getElementById('sheet').classList.remove('open');}
document.getElementById('fab').onclick=()=>{U.type='mort';U.rationEdit=null;form();document.getElementById('sheet').classList.add('open');};
document.getElementById('sheet').onclick=e=>{if(e.target.id==='sheet')close();};
render();
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
