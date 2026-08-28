/* La Fraiserie Studio — functional MVP layer
 * Persists newsletters/contacts in localStorage.
 * GitHub Pages remains the static frontend; real email delivery requires a backend/provider.
 */
(function () {
  'use strict';
  const KEY = 'fraiserie-studio-v1';
  const seed = {
    newsletters: [
      {id:'berry-pro', name:'Berry Pro', subject:'Et si votre bureau était vraiment fait pour vous ?', status:'Prête', body:'Vous passez plusieurs heures par jour derrière votre bureau ? Votre espace de travail peut enfin être pensé autour de vos usages, de votre confort et de votre personnalité.', cta:'DÉCOUVRIR BERRY PRO', updatedAt:new Date().toISOString()},
      {id:'atelier', name:'Atelier', subject:'De l’atelier à votre bureau : comment naît une création', status:'Brouillon', body:'Découvrez les coulisses de La Fraiserie et les étapes qui donnent vie à nos créations.', cta:'DÉCOUVRIR L’ATELIER', updatedAt:new Date().toISOString()}
    ],
    contacts: [],
    current: 'berry-pro'
  };
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || seed; } catch(e){ return seed; } }
  let db = load();
  function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
  function id(){ return Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8); }
  function esc(s){ return String(s||'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m])); }
  function notify(msg){ if(typeof window.toast==='function') window.toast(msg); else alert(msg); }
  function current(){ return db.newsletters.find(n=>n.id===db.current) || db.newsletters[0]; }

  function ensureNav(){
    const nav=document.querySelector('.nav'); if(!nav || document.querySelector('[data-view="contacts"]')) return;
    const b=document.createElement('button'); b.dataset.view='contacts'; b.innerHTML='<span class="ico">◎</span><span>Contacts</span>';
    b.addEventListener('click',()=>window.show('contacts')); nav.appendChild(b);
    const section=document.createElement('section'); section.id='contacts'; section.className='view'; section.innerHTML=`<div class="section-title"><h2>Contacts</h2><div class="actions"><button class="btn" id="exportContacts">Exporter CSV</button><label class="btn primary" style="display:inline-block">+ Importer CSV<input id="contactFile" type="file" accept=".csv,text/csv" hidden></label></div></div><div class="card"><p id="contactCount" style="color:var(--muted)"></p><div style="overflow:auto"><table class="table"><thead><tr><th>Email</th><th>Prénom</th><th>Nom</th><th>Statut</th><th></th></tr></thead><tbody id="contactRows"></tbody></table></div></div>`;
    document.querySelector('.content').appendChild(section);
    document.getElementById('contactFile').addEventListener('change', e=>{ if(e.target.files[0]) importCSV(e.target.files[0]); });
    document.getElementById('exportContacts').addEventListener('click', exportContacts);
  }

  function renderContacts(){
    const rows=document.getElementById('contactRows'); if(!rows) return;
    document.getElementById('contactCount').textContent=`${db.contacts.length} contact(s) enregistré(s) localement. Importez un CSV avec une colonne email pour alimenter votre audience.`;
    rows.innerHTML=db.contacts.map(c=>`<tr><td>${esc(c.email)}</td><td>${esc(c.firstName)}</td><td>${esc(c.lastName)}</td><td><span class="badge green">Actif</span></td><td><button class="btn" data-del-contact="${esc(c.email)}">Supprimer</button></td></tr>`).join('') || '<tr><td colspan="5">Aucun contact. Importez votre premier fichier CSV.</td></tr>';
    rows.querySelectorAll('[data-del-contact]').forEach(b=>b.onclick=()=>{db.contacts=db.contacts.filter(c=>c.email!==b.dataset.delContact);save();renderContacts();});
  }

  function parseCSV(text){
    const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(Boolean); if(!lines.length) return [];
    const sep=lines[0].includes(';')?';':',';
    const parse=l=>{const out=[];let cur='',q=false;for(let i=0;i<l.length;i++){const ch=l[i];if(ch==='\"'){if(q&&l[i+1]==='\"'){cur+='\"';i++;}else q=!q;}else if(ch===sep&&!q){out.push(cur.trim());cur='';}else cur+=ch;}out.push(cur.trim());return out;};
    const head=parse(lines.shift()).map(x=>x.toLowerCase());
    const idx=(names, fallback)=>{const i=head.findIndex(h=>names.some(n=>h===n||h.includes(n)));return i<0?fallback:i;};
    const ei=idx(['email','e-mail'],0), fi=idx(['prenom','prénom','first'],1), li=idx(['nom','last'],2);
    return lines.map(parse).map(r=>({email:(r[ei]||'').toLowerCase(),firstName:r[fi]||'',lastName:r[li]||''})).filter(c=>/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email));
  }
  function importCSV(file){
    const reader=new FileReader(); reader.onload=()=>{const incoming=parseCSV(reader.result);const map=new Map(db.contacts.map(c=>[c.email,c]));incoming.forEach(c=>map.set(c.email,c));db.contacts=[...map.values()];save();renderContacts();notify(`${incoming.length} contact(s) importé(s)`);};reader.readAsText(file,'utf-8');
  }
  function exportContacts(){
    const csv='email;prenom;nom\n'+db.contacts.map(c=>[c.email,c.firstName,c.lastName].map(v=>'"'+String(v||'').replace(/"/g,'""')+'"').join(';')).join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='contacts-la-fraiserie.csv';a.click();URL.revokeObjectURL(a.href);
  }

  function renderNewsletters(){
    const sec=document.getElementById('newsletters'); if(!sec) return;
    const card=sec.querySelector('.card'); if(!card) return;
    card.innerHTML=`<div style="display:flex;justify-content:flex-end;margin-bottom:10px"><button class="btn primary" id="newCampaign">+ Nouvelle newsletter</button></div><div style="overflow:auto"><table class="table"><thead><tr><th>Campagne</th><th>Objet</th><th>Statut</th><th>Mis à jour</th><th>Actions</th></tr></thead><tbody>${db.newsletters.map(n=>`<tr><td><b>${esc(n.name)}</b></td><td>${esc(n.subject)}</td><td><span class="badge ${n.status==='Programmée'?'blue':n.status==='Envoyée'?'green':'orange'}">${esc(n.status)}</span></td><td>${new Date(n.updatedAt).toLocaleString('fr-FR')}</td><td><button class="btn" data-edit="${n.id}">Modifier</button> <button class="btn" data-delete="${n.id}">Supprimer</button></td></tr>`).join('')}</tbody></table></div>`;
    document.getElementById('newCampaign').onclick=newCampaign;
    card.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openEditor(b.dataset.edit));
    card.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Supprimer cette newsletter ?')){db.newsletters=db.newsletters.filter(n=>n.id!==b.dataset.delete);if(!db.newsletters.length)db.newsletters=[{id:id(),name:'Nouvelle newsletter',subject:'',status:'Brouillon',body:'',cta:'DÉCOUVRIR',updatedAt:new Date().toISOString()}];db.current=db.newsletters[0].id;save();renderNewsletters();openEditor(db.current);}});
  }

  function openEditor(newsId){
    db.current=newsId;save();if(typeof window.show==='function')window.show('editor');
    const n=current(); if(!n)return;
    const subject=document.getElementById('subject'); if(subject){subject.value=n.subject||'';subject.dispatchEvent(new Event('input'));}
    const email=document.querySelector('#editor .email'); if(email){const h=email.querySelector('h2');const ps=email.querySelectorAll('p');const cta=email.querySelector('.cta');if(h)h.textContent=n.subject||'Votre newsletter';if(ps[0])ps[0].textContent=n.body||'Votre contenu newsletter…';if(ps[1])ps[1].textContent='Découvrez nos créations et imaginez un espace qui vous ressemble.';if(cta)cta.textContent=n.cta||'DÉCOUVRIR';}
    ensureEditorTools();
  }
  function newCampaign(){const n={id:id(),name:'Nouvelle newsletter',subject:'',status:'Brouillon',body:'',cta:'DÉCOUVRIR',updatedAt:new Date().toISOString()};db.newsletters.unshift(n);db.current=n.id;save();renderNewsletters();openEditor(n.id);}
  function ensureEditorTools(){
    const ed=document.querySelector('#editor .section-title .actions');if(!ed||ed.dataset.ready)return;ed.dataset.ready='1';
    ed.innerHTML='<button class="btn" id="saveDraft">Enregistrer</button><button class="btn" id="testCampaign">Aperçu</button><button class="btn primary" id="scheduleCampaign">Programmer</button>';
    document.getElementById('saveDraft').onclick=saveDraft;
    document.getElementById('testCampaign').onclick=preview;
    document.getElementById('scheduleCampaign').onclick=schedule;
    const right=document.querySelector('#editor .right');if(right&&!right.querySelector('#campaignName')){const h=document.createElement('div');h.innerHTML='<h3>Nom de campagne</h3><input id="campaignName" style="width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;margin-bottom:12px">';right.insertBefore(h,right.firstChild);document.getElementById('campaignName').oninput=()=>{const n=current();n.name=document.getElementById('campaignName').value;};}
    const n=current();const name=document.getElementById('campaignName');if(name)name.value=n.name||'';
  }
  function saveDraft(){
    const n=current();if(!n)return;const subject=document.getElementById('subject');const email=document.querySelector('#editor .email');n.subject=subject?subject.value.trim():n.subject;n.name=document.getElementById('campaignName')?.value.trim()||n.name;n.body=email?.querySelector('p')?.textContent.trim()||n.body;n.cta=email?.querySelector('.cta')?.textContent.trim()||n.cta;n.status='Brouillon';n.updatedAt=new Date().toISOString();save();renderNewsletters();notify('Brouillon enregistré sur cet appareil');
  }
  function preview(){const n=current();if(!n)return;const w=window.open('','_blank','noopener');if(!w){notify('Autorisez les fenêtres pop-up pour la prévisualisation');return;}w.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${esc(n.subject)}</title><style>body{margin:0;background:#f4f1ec;font-family:Arial;color:#202124}.mail{max-width:600px;margin:40px auto;background:#fff;padding:30px;box-shadow:0 10px 35px #0001}.head{text-align:center;border-bottom:1px solid #eee;padding-bottom:20px}.hero{margin:20px 0;padding:50px 20px;background:#4b4036;color:#fff;font-size:28px;font-weight:bold}.cta{display:inline-block;background:#c92f45;color:#fff;padding:12px 18px;text-decoration:none;border-radius:7px}</style></head><body><article class="mail"><div class="head"><b>LA FRAISERIE</b><br><small>Bureaux sur mesure · Fabrication artisanale · Made in France 🇫🇷</small></div><div class="hero">${esc(n.subject)}</div><h2>${esc(n.subject)}</h2><p>${esc(n.body)}</p><p>Découvrez nos créations et imaginez un espace qui vous ressemble.</p><a class="cta">${esc(n.cta)}</a></article></body></html>`);w.document.close();}
  function schedule(){
    const n=current();if(!n)return;const when=prompt('Date et heure d’envoi (ex. 30/08/2026 09:00) :');if(!when)return;n.status='Programmée';n.scheduledAt=when;n.updatedAt=new Date().toISOString();save();renderNewsletters();notify('Campagne enregistrée comme programmée. L’envoi réel nécessite le backend d’envoi.');
  }

  function init(){
    ensureNav();renderContacts();renderNewsletters();openEditor(db.current||db.newsletters[0]?.id);save();
    const observer=new MutationObserver(()=>{if(document.getElementById('editor')?.classList.contains('active'))ensureEditorTools();});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  }
  window.FraiserieApp={db:()=>db,save,importCSV,exportContacts,openEditor};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
