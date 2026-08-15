#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]

# 1) Expose one canonical server-login function from admin-auth-v5.
auth_path = ROOT / 'js' / 'admin-auth-v5.js'
auth = auth_path.read_text(encoding='utf-8')

if 'window.pnAdminServerLoginV5=async function' not in auth:
    marker = "window.submitAdminLogin=async function(ev){\n"
    export = r"""window.pnAdminServerLoginV5=async function(username,password){
  const u=String(username||'').trim();
  const p=String(password||'');
  if(!u||!p)throw new Error('Username dan password admin wajib diisi.');
  const cap=await capability();
  if(cap.v4&&cap.configured){
    await serverLogin(u,p);
    return {ok:true,mode:'server'};
  }
  if(cap.v4&&!cap.configured){
    if(await legacyMatches(u,p))return {ok:true,mode:'legacy'};
    throw new Error('Username atau password admin salah.');
  }
  if(await legacyMatches(u,p))return {ok:true,mode:'legacy-pre-v4'};
  throw new Error('Username atau password admin salah.');
};
window.pnAdminServerLoginV5.__serverAuthV5=true;

"""
    if marker not in auth:
        raise SystemExit('Marker submitAdminLogin v5 tidak ditemukan')
    auth = auth.replace(marker, export + marker, 1)

auth_path.write_text(auth, encoding='utf-8')

# 2) Make the ORIGINAL core submit function delegate to v5 at click time.
core_path = ROOT / 'js' / 'ui-v9-core.js'
core = core_path.read_text(encoding='utf-8')
new_submit = r"""async function submitAdminLogin(ev){
  if(ev)ev.preventDefault();
  const u=document.getElementById('adminUser')?.value.trim()||'';
  const p=document.getElementById('adminPass')?.value||'';
  const err=document.getElementById('loginError');
  const submit=document.querySelector('#loginModal .loginSubmit');
  if(err)err.textContent='';
  if(!u||!p){if(err)err.textContent='Username dan password admin wajib diisi.';return false}
  if(submit){submit.disabled=true;submit.textContent='MEMERIKSA...'}
  try{
    if(typeof window.pnAdminServerLoginV5==='function'){
      const r=await window.pnAdminServerLoginV5(u,p);
      if(!r||!r.ok)throw new Error('Login admin gagal.');
      sessionStorage.setItem('pnAdminAuth','1');
      closeAdminLogin();
      enterAdmin(true);
      return false;
    }
    // Fallback hanya untuk keadaan file v5 belum termuat; tidak mengambil alih bila v5 tersedia.
    const hash=await sha256Hex(p);
    if(u===PN_ADMIN_USER&&hash===PN_ADMIN_PASS_HASH){
      sessionStorage.setItem('pnAdminAuth','1');closeAdminLogin();enterAdmin(true);return false;
    }
    if(err)err.textContent='Username atau password admin salah.';
  }catch(e){
    if(err)err.textContent='Login server gagal: '+String(e?.message||e||'Tidak diketahui');
  }finally{
    if(submit){submit.disabled=false;submit.textContent='MASUK'}
  }
  return false
}
"""
pat = re.compile(r"async function submitAdminLogin\(ev\)\{.*?^\}\n(?=function setAdminControls)", re.S | re.M)
core2, n = pat.subn(new_submit, core, count=1)
if n != 1:
    raise SystemExit('Fungsi submitAdminLogin inti tidak ditemukan')
core_path.write_text(core2, encoding='utf-8')

# 3) Cache bust the core loader.
ui_path = ROOT / 'js' / 'ui-v9.js'
ui = ui_path.read_text(encoding='utf-8')
ui = re.sub(r'js/ui-v9-core\.js\?v=\d+', 'js/ui-v9-core.js?v=28', ui)
ui_path.write_text(ui, encoding='utf-8')

# 4) Cache bust both ui loader and auth v5 in index.
index_path = ROOT / 'index.html'
index = index_path.read_text(encoding='utf-8')
index = re.sub(r'js/ui-v9\.js\?v=\d+', 'js/ui-v9.js?v=50', index)
index = re.sub(r'js/admin-auth-v5\.js\?v=\d+', 'js/admin-auth-v5.js?v=3', index)
index_path.write_text(index, encoding='utf-8')

print('Core login now delegates to server auth v5; caches bumped.')
