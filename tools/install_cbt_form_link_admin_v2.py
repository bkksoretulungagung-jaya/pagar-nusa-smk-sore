from pathlib import Path

repo = Path('.')
js_path = repo / 'js' / 'cbt-toggle-v1.js'
siswa_path = repo / 'siswa.html'

js = js_path.read_text(encoding='utf-8')
siswa = siswa_path.read_text(encoding='utf-8')

# --- Upgrade admin CBT switch: preserve and edit Google Form URL ---
js = js.replace(
"let currentState='ON';\nlet lastToken='';",
"let currentState='ON';\nlet currentLink='';\nlet lastToken='';"
)

old_state = '''function stateFromItems(items){
  const arr=Array.isArray(items)?items:[];
  const item=arr.find(x=>String(x?.id||'')===SETTING_ID)||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PORTAL CBT ONLINE');
  if(!item)return'ON';
  const value=String(item.body||item.summary||'ON').trim().toUpperCase();
  return value==='OFF'?'OFF':'ON';
}
'''
new_state = '''function settingFromItems(items){
  const arr=Array.isArray(items)?items:[];
  return arr.find(x=>String(x?.id||'')===SETTING_ID)||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PORTAL CBT ONLINE')||null;
}
function stateFromItems(items){
  const item=settingFromItems(items);
  if(!item)return'ON';
  const value=String(item.body||item.summary||'ON').trim().toUpperCase();
  return value==='OFF'?'OFF':'ON';
}
function validFormUrl(value){return /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(String(value||'').trim())}
function linkFromItems(items){
  const item=settingFromItems(items);
  const value=String(item?.link||'').trim();
  return validFormUrl(value)?value:'';
}
'''
if old_state not in js:
    raise SystemExit('Pola stateFromItems CBT tidak ditemukan')
js = js.replace(old_state, new_state, 1)

old_css = '''  .pnCbtSwitchBadge{padding:7px 9px;border-radius:999px;font-size:9px;font-weight:1000;background:#e2e8f0;color:#475569}.pnCbtSwitchBadge.on{background:#dcfce7;color:#166534}.pnCbtSwitchBadge.off{background:#fee2e2;color:#991b1b}
  @media(max-width:680px){.pnCbtSwitchBox{align-items:flex-start}.pnCbtSwitchActions{width:100%}.pnCbtSwitchBtn{flex:1}}
'''
new_css = '''  .pnCbtSwitchBadge{padding:7px 9px;border-radius:999px;font-size:9px;font-weight:1000;background:#e2e8f0;color:#475569}.pnCbtSwitchBadge.on{background:#dcfce7;color:#166534}.pnCbtSwitchBadge.off{background:#fee2e2;color:#991b1b}
  .pnCbtLinkBox{flex:1 0 100%;padding-top:10px;border-top:1px dashed #cbd5e1}.pnCbtLinkBox label{display:block;margin:0 0 6px;color:#14532d;font-size:10px;font-weight:1000}.pnCbtLinkRow{display:flex;gap:7px;align-items:center}.pnCbtLinkInput{flex:1;min-width:180px;border:1px solid #cbd5e1;border-radius:9px;padding:9px 10px;background:#fff;color:#1e293b;font:inherit;font-size:10px}.pnCbtLinkSave{border:0;border-radius:9px;padding:9px 12px;background:#0f766e;color:#fff;font:inherit;font-size:10px;font-weight:1000;cursor:pointer;white-space:nowrap}.pnCbtLinkSave:disabled,.pnCbtLinkInput:disabled{opacity:.55;cursor:not-allowed}.pnCbtLinkHelp{display:block;margin-top:6px;color:#64748b;font-size:9px;line-height:1.45}
  @media(max-width:680px){.pnCbtSwitchBox{align-items:flex-start}.pnCbtSwitchActions{width:100%}.pnCbtSwitchBtn{flex:1}.pnCbtLinkRow{display:grid;grid-template-columns:1fr}.pnCbtLinkSave{width:100%}}
'''
if old_css not in js:
    raise SystemExit('Pola CSS CBT tidak ditemukan')
js = js.replace(old_css, new_css, 1)

old_html = '''function switchHtml(){return `
  <div id="pnCbtAdminSwitch" class="pnCbtSwitchBox">
    <div class="pnCbtSwitchInfo"><strong>📝 PORTAL CBT ONLINE</strong><span id="pnCbtSwitchHelp">Atur apakah Portal CBT ditampilkan untuk anggota.</span></div>
    <div class="pnCbtSwitchActions"><span id="pnCbtSwitchBadge" class="pnCbtSwitchBadge">MEMUAT</span><button id="pnCbtSwitchOn" class="pnCbtSwitchBtn on" type="button">ON</button><button id="pnCbtSwitchOff" class="pnCbtSwitchBtn off" type="button">OFF</button></div>
  </div>`}
'''
new_html = '''function switchHtml(){return `
  <div id="pnCbtAdminSwitch" class="pnCbtSwitchBox">
    <div class="pnCbtSwitchInfo"><strong>📝 PORTAL CBT ONLINE</strong><span id="pnCbtSwitchHelp">Atur apakah Portal CBT ditampilkan untuk anggota.</span></div>
    <div class="pnCbtSwitchActions"><span id="pnCbtSwitchBadge" class="pnCbtSwitchBadge">MEMUAT</span><button id="pnCbtSwitchOn" class="pnCbtSwitchBtn on" type="button">ON</button><button id="pnCbtSwitchOff" class="pnCbtSwitchBtn off" type="button">OFF</button></div>
    <div class="pnCbtLinkBox"><label for="pnCbtFormUrl">🔗 LINK GOOGLE FORM CBT</label><div class="pnCbtLinkRow"><input id="pnCbtFormUrl" class="pnCbtLinkInput" type="url" inputmode="url" placeholder="https://forms.gle/... atau https://docs.google.com/forms/..."><button id="pnCbtSaveLink" class="pnCbtLinkSave" type="button">SIMPAN LINK</button></div><span id="pnCbtLinkHelp" class="pnCbtLinkHelp">Tempel link Google Form baru lalu klik SIMPAN LINK.</span></div>
  </div>`}
'''
if old_html not in js:
    raise SystemExit('Pola switchHtml CBT tidak ditemukan')
js = js.replace(old_html, new_html, 1)

js = js.replace(
"  $('pnCbtSwitchOn').onclick=()=>saveState('ON');\n  $('pnCbtSwitchOff').onclick=()=>saveState('OFF');",
"  $('pnCbtSwitchOn').onclick=()=>saveState('ON');\n  $('pnCbtSwitchOff').onclick=()=>saveState('OFF');\n  $('pnCbtSaveLink').onclick=saveLink;"
)

old_render = '''function renderSwitchState(message=''){
  const badge=$('pnCbtSwitchBadge'),on=$('pnCbtSwitchOn'),off=$('pnCbtSwitchOff'),help=$('pnCbtSwitchHelp');
  if(!badge||!on||!off)return;
  const hasToken=!!token();
  on.classList.toggle('active',currentState==='ON');off.classList.toggle('active',currentState==='OFF');
  badge.textContent=currentState==='ON'?'AKTIF / ON':'TUTUP / OFF';badge.className='pnCbtSwitchBadge '+(currentState==='ON'?'on':'off');
  on.disabled=off.disabled=!hasToken;
  if(help)help.textContent=message||(hasToken?(currentState==='ON'?'Portal CBT aktif. Tombol CBT tampil untuk anggota.':'Portal CBT ditutup. Tombol CBT disembunyikan dari pengunjung.'):'Klik HUBUNGKAN AKSES terlebih dahulu untuk mengubah ON/OFF.');
}
'''
new_render = '''function renderSwitchState(message=''){
  const badge=$('pnCbtSwitchBadge'),on=$('pnCbtSwitchOn'),off=$('pnCbtSwitchOff'),help=$('pnCbtSwitchHelp'),input=$('pnCbtFormUrl'),save=$('pnCbtSaveLink'),linkHelp=$('pnCbtLinkHelp');
  if(!badge||!on||!off)return;
  const hasToken=!!token();
  on.classList.toggle('active',currentState==='ON');off.classList.toggle('active',currentState==='OFF');
  badge.textContent=currentState==='ON'?'AKTIF / ON':'TUTUP / OFF';badge.className='pnCbtSwitchBadge '+(currentState==='ON'?'on':'off');
  on.disabled=off.disabled=!hasToken;
  if(input){input.disabled=!hasToken;if(document.activeElement!==input)input.value=currentLink||''}
  if(save)save.disabled=!hasToken;
  if(linkHelp)linkHelp.textContent=currentLink?'✓ Link CBT tersimpan. Anda dapat menggantinya kapan saja.':'Belum ada link tersimpan di pengaturan. Tempel link Google Form lalu klik SIMPAN LINK.';
  if(help)help.textContent=message||(hasToken?(currentState==='ON'?'Portal CBT aktif. Tombol CBT tampil untuk anggota.':'Portal CBT ditutup. Tombol CBT disembunyikan dari pengunjung.'):'Klik HUBUNGKAN AKSES terlebih dahulu untuk mengubah pengaturan.');
}
'''
if old_render not in js:
    raise SystemExit('Pola renderSwitchState CBT tidak ditemukan')
js = js.replace(old_render, new_render, 1)

old_load_admin = '''    const shared=await sharedCmsData('__pnCmsAdminData');
    const r=shared||await jsonp('contentAdminList',{token:t},16000);
    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
    applyState(stateFromItems(r.content));
'''
new_load_admin = '''    const shared=await sharedCmsData('__pnCmsAdminData');
    const r=shared||await jsonp('contentAdminList',{token:t},16000);
    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');
    currentLink=linkFromItems(r.content);
    applyState(stateFromItems(r.content));
'''
if old_load_admin not in js:
    raise SystemExit('Pola loadAdminState CBT tidak ditemukan')
js = js.replace(old_load_admin, new_load_admin, 1)

js = js.replace(
"const item={id:SETTING_ID,type:'PENGATURAN',title:'PORTAL CBT ONLINE',summary:state,body:state,date:'',badge:'FITUR',link:'',status:'PUBLIK',order:998};",
"const item={id:SETTING_ID,type:'PENGATURAN',title:'PORTAL CBT ONLINE',summary:state,body:state,date:'',badge:'FITUR',link:currentLink,status:'PUBLIK',order:998};"
)

marker = '''function watchAdmin(){
'''
if marker not in js:
    raise SystemExit('Marker watchAdmin CBT tidak ditemukan')
save_link_fn = '''async function saveLink(){
  const t=token();if(!t){renderSwitchState('Hubungkan akses admin terlebih dahulu.');return}
  const input=$('pnCbtFormUrl'),save=$('pnCbtSaveLink');
  const value=String(input?.value||'').trim();
  if(!validFormUrl(value)){
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='Link tidak valid. Gunakan link Google Form dari forms.gle atau docs.google.com/forms.';
    input?.focus();return;
  }
  if(save)save.disabled=true;
  if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='Menyimpan link Google Form CBT...';
  const item={id:SETTING_ID,type:'PENGATURAN',title:'PORTAL CBT ONLINE',summary:currentState,body:currentState,date:'',badge:'FITUR',link:value,status:'PUBLIK',order:998};
  try{
    await postReliable('contentAdminSave',{token:t,section:'content',itemJson:JSON.stringify(item)});
    currentLink=value;
    renderSwitchState('✓ Link Google Form CBT berhasil diperbarui.');
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent='✓ Link CBT tersimpan dan akan dipakai Portal CBT.';
  }catch(err){
    if($('pnCbtLinkHelp'))$('pnCbtLinkHelp').textContent=err.message||'Gagal menyimpan link CBT.';
  }finally{if(save)save.disabled=!token()}
}

'''
if save_link_fn not in js:
    js = js.replace(marker, save_link_fn + marker, 1)

# --- Upgrade siswa.html: obtain CBT URL from public CMS setting ---
siswa = siswa.replace(
"const GOOGLE_FORM_URL='https://forms.gle/tNFHcxG1FNJFmbNw8';",
"const CONTENT_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';\nconst FALLBACK_GOOGLE_FORM_URL='https://forms.gle/tNFHcxG1FNJFmbNw8';\nlet GOOGLE_FORM_URL=FALLBACK_GOOGLE_FORM_URL;\nlet CBT_ENABLED=true;"
)

siswa = siswa.replace(
"const formReady=/^https:\\/\\/(docs\\.google\\.com\\/forms|forms\\.gle)\\//i.test(GOOGLE_FORM_URL.trim());\n",
""
)

old_form_block = '''if(formReady){
  examBtn.href=GOOGLE_FORM_URL.trim();
  examBtn.classList.remove('disabled');
  formNote.innerHTML='Jawaban dan nilai akan disimpan melalui Google Form/Google Sheets.<br><b>Sesudah menekan Kirim di Google Form, kembali ke portal ini untuk mengonfirmasi bahwa CBT sudah selesai.</b>';
}
'''
new_form_block = '''function validGoogleFormUrl(value){return /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(String(value||'').trim())}
function contentJsonp(action,payload={},timeout=12000){return new Promise((resolve,reject)=>{const cb='pnCbtCfg_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\\W/g,'');const s=document.createElement('script');let done=false;const clean=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};s.remove()};window[cb]=d=>{if(done)return;done=true;clean();resolve(d)};const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));s.src=CONTENT_ENDPOINT+'?'+q.toString();s.async=true;s.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT tidak dapat dimuat.'))};const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT terlalu lama dimuat.'))},timeout);document.head.appendChild(s)})}
function applyCbtConfig(items){
  const arr=Array.isArray(items)?items:[];
  const item=arr.find(x=>String(x?.id||'')==='CFG-CBT')||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PORTAL CBT ONLINE');
  const state=String(item?.body||item?.summary||'ON').trim().toUpperCase();
  CBT_ENABLED=state!=='OFF';
  const savedLink=String(item?.link||'').trim();
  GOOGLE_FORM_URL=validGoogleFormUrl(savedLink)?savedLink:FALLBACK_GOOGLE_FORM_URL;
  if(CBT_ENABLED&&validGoogleFormUrl(GOOGLE_FORM_URL)){
    examBtn.href=GOOGLE_FORM_URL;
    examBtn.classList.remove('disabled');
    formNote.innerHTML='Jawaban dan nilai akan disimpan melalui Google Form/Google Sheets.<br><b>Sesudah menekan Kirim di Google Form, kembali ke portal ini untuk mengonfirmasi bahwa CBT sudah selesai.</b>';
  }else if(!CBT_ENABLED){
    examBtn.removeAttribute('href');examBtn.classList.add('disabled');
    formNote.textContent='Portal CBT sedang ditutup oleh admin.';
  }else{
    examBtn.removeAttribute('href');examBtn.classList.add('disabled');
    formNote.textContent='Link Google Form CBT belum dipasang oleh admin.';
  }
}
async function loadCbtConfig(){try{const r=await contentJsonp('contentPublicList');if(r?.ok)applyCbtConfig(r.content);else applyCbtConfig([])}catch(_){applyCbtConfig([])}}
loadCbtConfig();
'''
if old_form_block not in siswa:
    raise SystemExit('Pola link Google Form siswa.html tidak ditemukan')
siswa = siswa.replace(old_form_block, new_form_block, 1)

js_path.write_text(js, encoding='utf-8')
siswa_path.write_text(siswa, encoding='utf-8')
print('Pengaturan link Google Form CBT dari Admin berhasil dipasang.')
