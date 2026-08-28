(function(){
  'use strict';
  const TEST_RECIPIENT = 'didier@lafraiserie.fr';
  const escapeHtml = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  async function sendTest(){
    const subject = document.getElementById('subject')?.value?.trim() || 'Test — La Fraiserie Studio';
    const campaign = window.FraiserieApp?.db?.().newsletters?.find(n => n.id === window.FraiserieApp.db().current);
    const body = campaign?.body || document.querySelector('#editor .email p')?.textContent || 'Ceci est un e-mail de test envoyé depuis La Fraiserie Studio.';
    const html = `<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px"><h1>La Fraiserie Studio</h1><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(body)}</p><p style="color:#777">E-mail de test.</p></body></html>`;
    const btn=document.getElementById('sendTestReal'); if(btn) {btn.disabled=true;btn.textContent='Envoi…';}
    try{
      const r=await fetch('/api/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({to:TEST_RECIPIENT,subject,html,text:body})});
      const data=await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(data.error || `Erreur HTTP ${r.status}`);
      if(typeof window.toast==='function') window.toast(`Test envoyé à ${TEST_RECIPIENT} · ${data.id}`); else alert(`Test envoyé à ${TEST_RECIPIENT}`);
    }catch(e){
      if(typeof window.toast==='function') window.toast(`Échec de l'envoi : ${e.message}`); else alert(`Échec de l'envoi : ${e.message}`);
    }finally{if(btn){btn.disabled=false;btn.textContent='Envoyer un test';}}
  }
  function install(){
    const ed=document.querySelector('#editor .section-title .actions'); if(!ed || document.getElementById('sendTestReal')) return;
    const old=[...ed.querySelectorAll('button')].find(b=>/Envoyer un test/i.test(b.textContent));
    if(old) old.remove();
    const b=document.createElement('button');b.id='sendTestReal';b.className='btn';b.textContent='Envoyer un test';b.addEventListener('click',sendTest);ed.prepend(b);
  }
  function init(){install();new MutationObserver(install).observe(document.body,{subtree:true,childList:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
