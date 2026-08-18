from pathlib import Path

repo = Path('.')
code_path = repo / 'backend' / 'Code.gs'
page_path = repo / 'jadwal-cbt.html'

code = code_path.read_text(encoding='utf-8')
page = page_path.read_text(encoding='utf-8')

# 1) Cache successful CBT schedule save results so the admin page can poll reliably.
old = """    if (action === 'cbtScheduleAdminSave') {\n      result = cbtScheduleAdminSave_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-content');\n    }\n"""
new = """    if (action === 'cbtScheduleAdminSave') {\n      result = cbtScheduleAdminSave_(data);\n      result.rid = String(data.rid || '');\n      contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-content');\n    }\n"""
if old in code:
    code = code.replace(old, new, 1)
elif "contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-content');\n    }\n\n    if (action === 'contentAdminLogin')" not in code:
    raise SystemExit('Route cbtScheduleAdminSave tidak ditemukan')

# 2) Increase list timeout and auto-retry once on cold start.
page = page.replace("function jsonp(action,payload={},timeout=15000)", "function jsonp(action,payload={},timeout=30000)")

old_post_start = "function post(action,payload={},timeout=30000){return new Promise((resolve,reject)=>{"
if old_post_start not in page and "function post(action,payload={},timeout=60000)" not in page:
    raise SystemExit('Fungsi post jadwal CBT tidak ditemukan')

# Replace the compact post function with a robust post+poll implementation.
start = page.find("function post(action,payload={},timeout=30000){")
if start < 0:
    start = page.find("function post(action,payload={},timeout=60000){")
end = page.find("function statusBadge", start)
if start < 0 or end < 0:
    raise SystemExit('Batas fungsi post jadwal CBT tidak ditemukan')

robust = r'''function post(action,payload={},timeout=60000){return new Promise((resolve,reject)=>{
  const rid='sched-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnCbtSchedFrame'+rid.replace(/\W/g,'');frame.style.display='none';
  const form=document.createElement('form');form.method='POST';form.action=ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  let done=false,polling=false,lastErr=null;
  const clean=()=>{window.removeEventListener('message',onMsg);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),250)};
  const finish=(ok,value)=>{if(done)return;done=true;clean();ok?resolve(value):reject(value instanceof Error?value:new Error(String(value||'Permintaan ditolak server.')))};
  const onMsg=e=>{const d=e.data;if(!d||d.source!=='pn-content'||d.rid!==rid||done)return;d.ok?finish(true,d):finish(false,new Error(d.message||'Permintaan ditolak server.'))};
  window.addEventListener('message',onMsg);
  const started=Date.now();
  async function poll(){if(polling||done)return;polling=true;try{
    while(!done&&Date.now()-started<timeout){
      await new Promise(r=>setTimeout(r,850));
      try{
        const r=await jsonp('contentResult',{rid},9000);
        if(r&&r.pending)continue;
        if(r&&r.ok){finish(true,r);return}
        if(r&&!r.pending){finish(false,new Error(r.message||'Permintaan ditolak server.'));return}
      }catch(err){lastErr=err}
    }
    if(!done)finish(false,lastErr||new Error('Server terlalu lama merespons. Coba lagi; penyimpanan aman untuk diulang.'));
  }finally{polling=false}}
  const timer=setTimeout(()=>{if(!done)finish(false,lastErr||new Error('Server terlalu lama merespons. Coba lagi; penyimpanan aman untuk diulang.'))},timeout+1500);
  document.body.append(frame,form);form.submit();poll();
})}
'''
page = page[:start] + robust + page[end:]

# Retry load once if a cold start causes a temporary timeout.
old_load = "async function load(){const t=token();if(!t){$('notice').className='notice err';$('notice').textContent='Sesi Admin tidak ditemukan. Login Admin dari dashboard terlebih dahulu.';return}try{$('notice').className='notice';$('notice').textContent='Memuat akun dan jadwal CBT...';const r=await jsonp('cbtScheduleAdminList',{token:t});if(!r?.ok)throw new Error(r?.message||'Gagal memuat jadwal.');accounts=Array.isArray(r.accounts)?r.accounts:[];$('notice').className='notice ok';$('notice').textContent=`✓ ${accounts.length} akun dimuat. Pilih akun yang akan dijadwalkan.`;render()}catch(e){$('notice').className='notice err';$('notice').textContent=e.message||'Gagal memuat data.'}}"
new_load = "async function load(){const t=token();if(!t){$('notice').className='notice err';$('notice').textContent='Sesi Admin tidak ditemukan. Login Admin dari dashboard terlebih dahulu.';return}try{$('notice').className='notice';$('notice').textContent='Memuat akun dan jadwal CBT...';let r;try{r=await jsonp('cbtScheduleAdminList',{token:t},30000)}catch(_){$('notice').textContent='Server sedang bangun, mencoba sekali lagi...';r=await jsonp('cbtScheduleAdminList',{token:t},30000)}if(!r?.ok)throw new Error(r?.message||'Gagal memuat jadwal.');accounts=Array.isArray(r.accounts)?r.accounts:[];$('notice').className='notice ok';$('notice').textContent=`✓ ${accounts.length} akun dimuat. Pilih akun yang akan dijadwalkan.`;render()}catch(e){$('notice').className='notice err';$('notice').textContent=e.message||'Gagal memuat data.'}}"
if old_load in page:
    page = page.replace(old_load, new_load, 1)
elif "Server sedang bangun, mencoba sekali lagi" not in page:
    raise SystemExit('Fungsi load jadwal CBT tidak ditemukan')

code_path.write_text(code, encoding='utf-8')
page_path.write_text(page, encoding='utf-8')
print('OK: timeout CBT schedule diperbaiki')
