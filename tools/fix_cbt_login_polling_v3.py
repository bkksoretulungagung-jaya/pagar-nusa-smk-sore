from pathlib import Path

repo = Path('.')
code_path = repo / 'backend' / 'Code.gs'
siswa_path = repo / 'siswa.html'

code = code_path.read_text(encoding='utf-8')
siswa = siswa_path.read_text(encoding='utf-8')

# 1) Simpan hasil cbtAccessCheck berdasarkan RID agar browser tidak bergantung
#    pada postMessage iframe yang kadang terlambat/hilang setelah redirect Apps Script.
old_route = """    if (action === 'cbtAccessCheck') {\n      result = cbtAccessCheck_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-cbt');\n    }\n"""
new_route = """    if (action === 'cbtAccessCheck') {\n      result = cbtAccessCheck_(data);\n      result.rid = String(data.rid || '');\n      contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-cbt');\n    }\n"""
if old_route in code:
    code = code.replace(old_route, new_route, 1)
elif new_route not in code:
    raise SystemExit('Route cbtAccessCheck tidak ditemukan')

old_catch = """    if (action === 'cbtAccessCheck') {\n      return iframeResult_(result, 'pn-cbt');\n    }\n"""
new_catch = """    if (action === 'cbtAccessCheck') {\n      contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-cbt');\n    }\n"""
if old_catch in code:
    code = code.replace(old_catch, new_catch, 1)
elif new_catch not in code:
    raise SystemExit('Catch cbtAccessCheck tidak ditemukan')

code = code.replace("      cbtFastLoginVersion:'2',", "      cbtFastLoginVersion:'3',", 1)

# 2) Ganti transport CBT dengan POST + RID polling, sama seperti halaman Jadwal Admin.
start = siswa.find('function cbtRequest(')
end = siswa.find('async function authorizeCbt(', start)
if start < 0 or end < 0:
    raise SystemExit('Fungsi cbtRequest/authorizeCbt tidak ditemukan')

new_request = r'''function cbtRequest(action,payload={},timeout=22000){return new Promise((resolve,reject)=>{
  const rid='cbt-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnCbtFrame'+rid.replace(/\W/g,'');frame.style.display='none';
  const form=document.createElement('form');form.method='POST';form.action=CONTENT_ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  let done=false,pollBusy=false,lastErr=null;
  const started=Date.now();
  const clean=()=>{window.removeEventListener('message',onMsg);clearTimeout(timer);try{form.remove()}catch(_){};setTimeout(()=>{try{frame.remove()}catch(_){}},200)};
  const finish=(ok,value)=>{if(done)return;done=true;clean();ok?resolve(value):reject(value instanceof Error?value:new Error(String(value||'Verifikasi jadwal CBT gagal.')))};
  const onMsg=e=>{const d=e.data;if(!d||d.source!=='pn-cbt'||d.rid!==rid||done)return;d.ok?finish(true,d):finish(false,new Error(d.message||'Verifikasi jadwal CBT gagal.'))};
  window.addEventListener('message',onMsg);
  async function poll(){if(pollBusy||done)return;pollBusy=true;try{
    while(!done&&Date.now()-started<timeout){
      await new Promise(r=>setTimeout(r,420));
      try{
        const r=await contentJsonp('contentResult',{rid},5000);
        if(r&&r.pending)continue;
        if(r&&r.ok){finish(true,r);return}
        if(r&&!r.pending){finish(false,new Error(r.message||'Verifikasi jadwal CBT ditolak.'));return}
      }catch(err){lastErr=err}
    }
    if(!done)finish(false,lastErr||new Error('Koneksi CBT sedang sibuk. Silakan coba sekali lagi.'));
  }finally{pollBusy=false}}
  const timer=setTimeout(()=>{if(!done)finish(false,lastErr||new Error('Koneksi CBT sedang sibuk. Silakan coba sekali lagi.'))},timeout+1000);
  document.body.append(frame,form);form.submit();poll();
})}
'''
siswa = siswa[:start] + new_request + siswa[end:]

# 3) Tidak perlu mengirim request kedua saat respons iframe terlambat;
#    polling akan mengambil hasil request pertama begitu server selesai.
start = siswa.find('async function authorizeCbt(')
end = siswa.find('loadCbtConfig();', start)
if start < 0 or end < 0:
    raise SystemExit('Fungsi authorizeCbt tidak ditemukan')
new_authorize = r'''async function authorizeCbt(user,uname){
  if(!CBT_ENABLED)throw new Error('Portal CBT sedang ditutup oleh admin.');
  const idToken=await user.getIdToken();
  const r=await cbtRequest('cbtAccessCheck',{username:uname,idToken},22000);
  if(!r.allowed)throw new Error(r.message||'Akun Anda belum mendapat jadwal CBT.');
  currentFormUrl=String(r.formUrl||'');currentAccessEndAt=String(r.endAt||'');
  if(!/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(currentFormUrl))throw new Error('Link soal CBT belum tersedia.');
  examBtn.href=currentFormUrl;examBtn.classList.remove('disabled');
  formNote.innerHTML='✓ Akun Anda terjadwal mengikuti CBT.<br><b>Akses berlaku sampai '+new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(new Date(currentAccessEndAt))+' WIB.</b>';
  return r;
}
'''
siswa = siswa[:start] + new_authorize + siswa[end:]

code_path.write_text(code, encoding='utf-8')
siswa_path.write_text(siswa, encoding='utf-8')
print('CBT login polling v3 terpasang')
