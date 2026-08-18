from pathlib import Path

repo = Path('.')
code_path = repo / 'backend' / 'Code.gs'
siswa_path = repo / 'siswa.html'
toggle_path = repo / 'js' / 'cbt-toggle-v1.js'

code = code_path.read_text(encoding='utf-8')
siswa = siswa_path.read_text(encoding='utf-8')
toggle = toggle_path.read_text(encoding='utf-8')

# =========================================================
# BACKEND: schedule + secure CBT access
# =========================================================
if "const PN_CBT_SCHEDULE_SHEET_NAME" not in code:
    marker = "const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';\n"
    addition = marker + "const PN_CBT_SCHEDULE_SHEET_NAME = 'Jadwal CBT';\nconst PN_CBT_LOG_SHEET_NAME = 'Log CBT';\n"
    if marker not in code:
        raise SystemExit('Marker PN_FIREBASE_API_KEY tidak ditemukan')
    code = code.replace(marker, addition, 1)

if "cbtSchedule:true" not in code:
    marker = "      contentVersion:'1',\n"
    addition = marker + "      cbtSchedule:true,\n      cbtScheduleVersion:'1',\n"
    if marker not in code:
        raise SystemExit('Marker health contentVersion tidak ditemukan')
    code = code.replace(marker, addition, 1)

if "action === 'cbtScheduleAdminList'" not in code:
    marker = "  if (action === 'contentResult') {\n"
    block = """  if (action === 'cbtScheduleAdminList') {
    let result;
    try { result = cbtScheduleAdminList_(data); }
    catch (err) { result = {ok:false, accounts:[], message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

"""
    if marker not in code:
        raise SystemExit('Marker doGet contentResult tidak ditemukan')
    code = code.replace(marker, block + marker, 1)

if "action === 'cbtAccessCheck'" not in code:
    marker = "    if (action === 'contentAdminLogin') {\n"
    block = """    if (action === 'cbtAccessCheck') {
      result = cbtAccessCheck_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-cbt');
    }

    if (action === 'cbtScheduleAdminSave') {
      result = cbtScheduleAdminSave_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-content');
    }

"""
    if marker not in code:
        raise SystemExit('Marker doPost contentAdminLogin tidak ditemukan')
    code = code.replace(marker, block + marker, 1)

if "if (action === 'cbtAccessCheck')" not in code.split("} catch (err) {",1)[-1]:
    marker = "    if (action === 'biodataGet' || action === 'biodataUpdate') {\n      return iframeResult_(result, 'pn-biodata');\n    }\n"
    addition = marker + "    if (action === 'cbtAccessCheck') {\n      return iframeResult_(result, 'pn-cbt');\n    }\n"
    if marker not in code:
        raise SystemExit('Marker catch biodata tidak ditemukan')
    code = code.replace(marker, addition, 1)

old_actions = "'pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus'"
if "'cbtScheduleAdminSave'" not in code:
    if old_actions not in code:
        raise SystemExit('Marker daftar action pn-content tidak ditemukan')
    code = code.replace(old_actions, old_actions + ",'cbtScheduleAdminSave'", 1)

# Jangan bocorkan link CFG-CBT lewat contentPublicList.
old_link = "      link:String(r[7]||''),\n"
new_link = "      link:(!includeHidden && String(r[0]||'').trim()==='CFG-CBT') ? '' : String(r[7]||''),\n"
if new_link not in code:
    if old_link not in code:
        raise SystemExit('Marker link contentReadContent tidak ditemukan')
    code = code.replace(old_link, new_link, 1)

if "function cbtScheduleSheets_()" not in code:
    marker = "/* =========================================================\n   CONTENT MANAGER / CMS V1\n========================================================= */\n"
    funcs = r'''/* =========================================================
   JADWAL PESERTA CBT V1
   Link soal hanya dikirim sesudah akun + jadwal diverifikasi server.
========================================================= */
function cbtScheduleSheets_() {
  const book = SpreadsheetApp.openById(PN_BIODATA_SPREADSHEET_ID);
  let schedule = book.getSheetByName(PN_CBT_SCHEDULE_SHEET_NAME);
  let log = book.getSheetByName(PN_CBT_LOG_SHEET_NAME);
  if (!schedule) {
    schedule = book.insertSheet(PN_CBT_SCHEDULE_SHEET_NAME);
    schedule.appendRow(['Username','ID Anggota','Email','Mulai','Selesai','Status','Catatan','Diatur Oleh','Waktu Update']);
    schedule.setFrozenRows(1);
  }
  if (!log) {
    log = book.insertSheet(PN_CBT_LOG_SHEET_NAME);
    log.appendRow(['Waktu','Username','ID Anggota','Email','Aksi','Detail']);
    log.setFrozenRows(1);
  }
  return {book:book, schedule:schedule, log:log};
}

function cbtScheduleDateText_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss") + '+07:00';
  }
  const text = String(value || '').trim();
  if (!text) return '';
  const d = new Date(text);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss") + '+07:00';
  return text;
}

function cbtScheduleLog_(username, memberId, email, action, detail) {
  try {
    cbtScheduleSheets_().log.appendRow([
      new Date(),
      sanitize_(String(username || '').slice(0,100)),
      sanitize_(String(memberId || '').slice(0,80)),
      sanitize_(String(email || '').slice(0,160)),
      sanitize_(String(action || '').slice(0,40)),
      sanitize_(String(detail || '').slice(0,500))
    ]);
  } catch (_) {}
}

function cbtPortalAccounts_() {
  const sheets = cbtScheduleSheets_();
  const accountSheet = sheets.book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME);
  if (!accountSheet) throw new Error('Sheet Akun Portal Siswa tidak ditemukan.');
  const last = accountSheet.getLastRow();
  if (last < 2) return [];
  return accountSheet.getRange(2,1,last-1,5).getDisplayValues().map(function(r, i){
    return {
      row:i+2,
      username:String(r[0] || '').trim(),
      memberId:String(r[1] || '').trim(),
      email:String(r[2] || '').trim().toLowerCase(),
      uid:String(r[3] || '').trim(),
      status:String(r[4] || 'AKTIF').trim().toUpperCase()
    };
  }).filter(function(x){ return x.username && x.email; });
}

function cbtScheduleObject_(r) {
  return {
    exists:!!String(r[0] || '').trim(),
    username:String(r[0] || '').trim(),
    memberId:String(r[1] || '').trim(),
    email:String(r[2] || '').trim().toLowerCase(),
    startAt:cbtScheduleDateText_(r[3]),
    endAt:cbtScheduleDateText_(r[4]),
    status:String(r[5] || 'NONAKTIF').trim().toUpperCase(),
    note:String(r[6] || ''),
    updatedBy:String(r[7] || ''),
    updatedAt:cbtScheduleDateText_(r[8])
  };
}

function cbtScheduleMap_() {
  const sheet = cbtScheduleSheets_().schedule;
  const last = sheet.getLastRow();
  const out = {};
  if (last < 2) return out;
  const rows = sheet.getRange(2,1,last-1,9).getValues();
  rows.forEach(function(r){
    const obj = cbtScheduleObject_(r);
    if (!obj.username) return;
    out[obj.username.toLowerCase()] = obj;
  });
  return out;
}

function cbtScheduleComputedStatus_(account, schedule) {
  if (String(account.status || '').toUpperCase() !== 'AKTIF') return 'AKUN NONAKTIF';
  if (!schedule || !schedule.exists) return 'BELUM DIJADWALKAN';
  if (String(schedule.status || '').toUpperCase() !== 'AKTIF') return 'NONAKTIF';
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  if (!start || !end) return 'JADWAL TIDAK VALID';
  const now = Date.now();
  if (now < start) return 'MENUNGGU';
  if (now > end) return 'SELESAI';
  return 'SEDANG UJIAN';
}

function cbtScheduleAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const schedules = cbtScheduleMap_();
  const accounts = cbtPortalAccounts_().map(function(account){
    const schedule = schedules[account.username.toLowerCase()] || null;
    if (schedule) schedule.computedStatus = cbtScheduleComputedStatus_(account, schedule);
    return {
      username:account.username,
      memberId:account.memberId,
      email:account.email,
      status:account.status,
      schedule:schedule || {exists:false,computedStatus:'BELUM DIJADWALKAN'}
    };
  }).sort(function(a,b){ return String(a.username).localeCompare(String(b.username),'id'); });
  return {ok:true,admin:admin,accounts:accounts,serverTime:cbtScheduleDateText_(new Date()),version:'1'};
}

function cbtScheduleAdminSave_(data) {
  const admin = requireReviewAdmin_(data.token);
  const username = String(data.username || '').trim();
  const status = String(data.status || 'AKTIF').trim().toUpperCase();
  const note = sanitize_(String(data.note || '').trim()).slice(0,300);
  if (!username) throw new Error('Username akun wajib dipilih.');
  if (!['AKTIF','NONAKTIF'].includes(status)) throw new Error('Status jadwal tidak valid.');
  const accounts = cbtPortalAccounts_();
  const account = accounts.find(function(x){ return x.username.toLowerCase() === username.toLowerCase(); });
  if (!account) throw new Error('Akun Portal Siswa tidak ditemukan.');

  let start = null, end = null;
  const startRaw = String(data.startAt || '').trim();
  const endRaw = String(data.endAt || '').trim();
  if (startRaw) start = new Date(startRaw);
  if (endRaw) end = new Date(endRaw);
  if (status === 'AKTIF') {
    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) throw new Error('Waktu mulai dan selesai wajib diisi.');
    if (end.getTime() <= start.getTime()) throw new Error('Waktu selesai harus setelah waktu mulai.');
    if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) throw new Error('Durasi satu jadwal CBT maksimal 24 jam.');
  }

  const sheet = cbtScheduleSheets_().schedule;
  const last = sheet.getLastRow();
  let row = 0;
  if (last >= 2) {
    const users = sheet.getRange(2,1,last-1,1).getDisplayValues();
    for (let i=0;i<users.length;i++) {
      if (String(users[i][0] || '').trim().toLowerCase() === username.toLowerCase()) { row=i+2; break; }
    }
  }
  const values = [account.username,account.memberId,account.email,start || '',end || '',status,note,admin,new Date()];
  if (row) sheet.getRange(row,1,1,9).setValues([values]);
  else sheet.appendRow(values);
  cbtScheduleLog_(account.username,account.memberId,account.email,'ADMIN_JADWAL',status + ' | ' + cbtScheduleDateText_(start) + ' - ' + cbtScheduleDateText_(end) + (note ? ' | ' + note : ''));
  return {ok:true,username:account.username,status:status,message:status === 'AKTIF' ? 'Jadwal CBT berhasil diaktifkan.' : 'Jadwal CBT berhasil dinonaktifkan.'};
}

function cbtFormSetting_() {
  const sheets = contentSheets_();
  const items = contentReadContent_(sheets.content, true);
  const item = items.find(function(x){ return String(x.id || '') === 'CFG-CBT'; }) ||
    items.find(function(x){ return String(x.type || '').toUpperCase() === 'PENGATURAN' && String(x.title || '').toUpperCase() === 'PORTAL CBT ONLINE'; });
  const state = String(item && (item.body || item.summary) || 'ON').trim().toUpperCase();
  const link = String(item && item.link || '').trim();
  const valid = /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(link);
  return {enabled:state !== 'OFF', link:valid ? link : ''};
}

function cbtAccessCheck_(data) {
  const username = String(data.username || '').trim();
  const idToken = String(data.idToken || '').trim();
  if (!username || !idToken) throw new Error('Username dan sesi login CBT wajib tersedia.');
  const firebaseUser = verifyFirebaseToken_(idToken);
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  const uid = String(firebaseUser.localId || '').trim();
  if (!email || !uid) throw new Error('Akun Firebase tidak valid.');

  const accounts = cbtPortalAccounts_();
  const account = accounts.find(function(x){
    return x.username.toLowerCase() === username.toLowerCase() && x.email === email;
  });
  if (!account) {
    cbtScheduleLog_(username,'',email,'AKSES_DITOLAK','Username/email tidak cocok dengan Akun Portal Siswa.');
    return {ok:true,allowed:false,code:'ACCOUNT_NOT_FOUND',message:'Akun CBT tidak terdaftar. Hubungi admin.'};
  }
  if (account.status !== 'AKTIF') {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Akun portal NONAKTIF.');
    return {ok:true,allowed:false,code:'ACCOUNT_INACTIVE',message:'Akun portal Anda sedang nonaktif.'};
  }
  if (account.uid && account.uid !== uid) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','UID Firebase tidak cocok.');
    return {ok:true,allowed:false,code:'UID_MISMATCH',message:'Akun ini sudah terhubung dengan pengguna lain. Hubungi admin.'};
  }
  if (!account.uid) {
    try { cbtScheduleSheets_().book.getSheetByName(PN_PORTAL_ACCOUNT_SHEET_NAME).getRange(account.row,4).setValue(uid); } catch (_) {}
  }

  const schedule = cbtScheduleMap_()[account.username.toLowerCase()] || null;
  if (!schedule || !schedule.exists || schedule.status !== 'AKTIF') {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Belum memiliki jadwal CBT aktif.');
    return {ok:true,allowed:false,code:'NOT_SCHEDULED',message:'Anda belum dijadwalkan mengikuti CBT. Hubungi admin/pengurus.'};
  }
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  const now = Date.now();
  if (!start || !end) return {ok:true,allowed:false,code:'INVALID_SCHEDULE',message:'Jadwal CBT akun Anda belum valid. Hubungi admin.'};
  if (now < start) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Belum waktunya ujian.');
    return {ok:true,allowed:false,code:'NOT_STARTED',message:'Jadwal CBT Anda belum dimulai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }
  if (now > end) {
    cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DITOLAK','Waktu ujian sudah selesai.');
    return {ok:true,allowed:false,code:'EXPIRED',message:'Waktu CBT Anda sudah selesai.',startAt:schedule.startAt,endAt:schedule.endAt};
  }
  const cfg = cbtFormSetting_();
  if (!cfg.enabled) return {ok:true,allowed:false,code:'PORTAL_OFF',message:'Portal CBT sedang ditutup oleh admin.'};
  if (!cfg.link) return {ok:true,allowed:false,code:'NO_FORM',message:'Link soal CBT belum dipasang oleh admin.'};

  cbtScheduleLog_(account.username,account.memberId,email,'AKSES_DIBERIKAN','Jadwal aktif sampai ' + schedule.endAt);
  return {
    ok:true,
    allowed:true,
    username:account.username,
    memberId:account.memberId,
    email:account.email,
    startAt:schedule.startAt,
    endAt:schedule.endAt,
    formUrl:cfg.link,
    message:'Akses CBT diizinkan sesuai jadwal.',
    version:'1'
  };
}

'''
    if marker not in code:
        raise SystemExit('Marker CONTENT MANAGER tidak ditemukan')
    code = code.replace(marker, funcs + marker, 1)

# =========================================================
# STUDENT CBT PORTAL: server-side schedule authorization
# =========================================================
# Remove public/fallback form URL exposure.
old_const = "const CONTENT_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';\nconst FALLBACK_GOOGLE_FORM_URL='https://forms.gle/tNFHcxG1FNJFmbNw8';\nlet GOOGLE_FORM_URL=FALLBACK_GOOGLE_FORM_URL;\nlet CBT_ENABLED=true;\n"
new_const = "const CONTENT_ENDPOINT='https://script.google.com/macros/s/AKfycbyJi_83lJ11JshOLCzIBRMX6fEi-y9UGR9eYULuqH1BivdxeqcgMB0l2ehWBIgaad8Oyw/exec';\nlet CBT_ENABLED=true;\nlet currentFormUrl='';\nlet currentAccessEndAt='';\nlet loginInFlight=false;\n"
if old_const in siswa:
    siswa = siswa.replace(old_const, new_const, 1)
elif "let currentFormUrl=''" not in siswa:
    raise SystemExit('Marker konstanta CBT siswa tidak ditemukan')

old_apply = r'''function validGoogleFormUrl(value){return /^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(String(value||'').trim())}
function contentJsonp(action,payload={},timeout=12000){
  return new Promise((resolve,reject)=>{
    const cb='pnCbtCfg_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const s=document.createElement('script');let done=false;
    const clean=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};s.remove()};
    window[cb]=d=>{if(done)return;done=true;clean();resolve(d)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    s.src=CONTENT_ENDPOINT+'?'+q.toString();s.async=true;
    s.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT tidak dapat dimuat.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT terlalu lama dimuat.'))},timeout);
    document.head.appendChild(s);
  });
}
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
async function loadCbtConfig(){
  try{
    const r=await contentJsonp('contentPublicList');
    if(r?.ok)applyCbtConfig(r.content);else applyCbtConfig([]);
  }catch(_){applyCbtConfig([])}
}
loadCbtConfig();
'''
new_apply = r'''function contentJsonp(action,payload={},timeout=12000){
  return new Promise((resolve,reject)=>{
    const cb='pnCbtCfg_'+Date.now()+'_'+Math.random().toString(36).slice(2).replace(/\W/g,'');
    const s=document.createElement('script');let done=false;
    const clean=()=>{clearTimeout(timer);try{delete window[cb]}catch(_){};s.remove()};
    window[cb]=d=>{if(done)return;done=true;clean();resolve(d)};
    const q=new URLSearchParams({action,callback:cb,_ts:String(Date.now())});
    Object.entries(payload).forEach(([k,v])=>q.set(k,String(v??'')));
    s.src=CONTENT_ENDPOINT+'?'+q.toString();s.async=true;
    s.onerror=()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT tidak dapat dimuat.'))};
    const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Pengaturan CBT terlalu lama dimuat.'))},timeout);
    document.head.appendChild(s);
  });
}
function applyCbtConfig(items){
  const arr=Array.isArray(items)?items:[];
  const item=arr.find(x=>String(x?.id||'')==='CFG-CBT')||arr.find(x=>String(x?.type||'').toUpperCase()==='PENGATURAN'&&String(x?.title||'').toUpperCase()==='PORTAL CBT ONLINE');
  const state=String(item?.body||item?.summary||'ON').trim().toUpperCase();
  CBT_ENABLED=state!=='OFF';
  currentFormUrl='';currentAccessEndAt='';
  examBtn.removeAttribute('href');examBtn.classList.add('disabled');
  formNote.textContent=CBT_ENABLED?'Login akan diverifikasi dengan jadwal ujian oleh server.':'Portal CBT sedang ditutup oleh admin.';
}
async function loadCbtConfig(){
  try{const r=await contentJsonp('contentPublicList');if(r?.ok)applyCbtConfig(r.content);else applyCbtConfig([])}catch(_){applyCbtConfig([])}
}
function cbtRequest(action,payload={},timeout=25000){return new Promise((resolve,reject)=>{
  const rid='cbt-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const frame=document.createElement('iframe');frame.name='pnCbtFrame'+rid.replace(/\W/g,'');frame.style.display='none';
  const form=document.createElement('form');form.method='POST';form.action=CONTENT_ENDPOINT;form.target=frame.name;form.style.display='none';
  Object.entries({action,rid,...payload}).forEach(([k,v])=>{const i=document.createElement('input');i.type='hidden';i.name=k;i.value=String(v??'');form.appendChild(i)});
  let done=false;const clean=()=>{window.removeEventListener('message',onMsg);clearTimeout(timer);form.remove();setTimeout(()=>frame.remove(),250)};
  const onMsg=e=>{const d=e.data;if(!d||d.source!=='pn-cbt'||d.rid!==rid||done)return;done=true;clean();d.ok?resolve(d):reject(new Error(d.message||'Verifikasi jadwal CBT gagal.'))};
  window.addEventListener('message',onMsg);const timer=setTimeout(()=>{if(done)return;done=true;clean();reject(new Error('Server jadwal CBT terlalu lama merespons.'))},timeout);
  document.body.append(frame,form);form.submit();
})}
async function authorizeCbt(user,uname){
  if(!CBT_ENABLED)throw new Error('Portal CBT sedang ditutup oleh admin.');
  const idToken=await user.getIdToken(true);
  const r=await cbtRequest('cbtAccessCheck',{username:uname,idToken});
  if(!r.allowed)throw new Error(r.message||'Akun Anda belum mendapat jadwal CBT.');
  currentFormUrl=String(r.formUrl||'');currentAccessEndAt=String(r.endAt||'');
  if(!/^https:\/\/(docs\.google\.com\/forms|forms\.gle)\//i.test(currentFormUrl))throw new Error('Link soal CBT belum tersedia.');
  examBtn.href=currentFormUrl;examBtn.classList.remove('disabled');
  formNote.innerHTML='✓ Akun Anda terjadwal mengikuti CBT.<br><b>Akses berlaku sampai '+new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',dateStyle:'medium',timeStyle:'short'}).format(new Date(currentAccessEndAt))+' WIB.</b>';
  return r;
}
loadCbtConfig();
'''
if old_apply in siswa:
    siswa = siswa.replace(old_apply, new_apply, 1)
elif "function authorizeCbt(user,uname)" not in siswa:
    raise SystemExit('Blok konfigurasi CBT siswa tidak ditemukan')

old_auth = """  const showLogin=()=>{currentStudentUser=null;loginView.classList.remove('hidden');studentView.classList.add('hidden');password.value=''};
  const showStudent=(user,name)=>{studentName.textContent=name||user.displayName||'Anggota';studentEmail.textContent=user.email||'-';loginView.classList.add('hidden');studentView.classList.remove('hidden');syncCbtState(user,name)};
  onAuthStateChanged(auth,user=>{if(user){const saved=sessionStorage.getItem('pnStudentUsername')||user.displayName||'Anggota';showStudent(user,saved)}else showLogin()});
  form.addEventListener('submit',async e=>{
    e.preventDefault();loginError.textContent='';loginBtn.disabled=true;loginBtn.textContent='MEMERIKSA...';
    const uname=username.value.trim();
    try{
      const cred=await signInWithEmailAndPassword(auth,email.value.trim(),password.value);
      const display=String(cred.user.displayName||'').trim();
      if(display && display.toLowerCase()!==uname.toLowerCase()){
        await signOut(auth);throw new Error('USERNAME_MISMATCH');
      }
      sessionStorage.setItem('pnStudentUsername',uname);showStudent(cred.user,uname);
    }catch(err){loginError.textContent=err?.message==='USERNAME_MISMATCH'?'Username tidak sesuai dengan akun tersebut.':'Username, email, atau password salah / akun belum dibuat.'}
    finally{loginBtn.disabled=false;loginBtn.textContent='MASUK PORTAL CBT ONLINE'}
  });
"""
new_auth = """  const showLogin=()=>{currentStudentUser=null;currentFormUrl='';currentAccessEndAt='';examBtn.removeAttribute('href');examBtn.classList.add('disabled');loginView.classList.remove('hidden');studentView.classList.add('hidden');password.value=''};
  const showStudent=(user,name)=>{studentName.textContent=name||user.displayName||'Anggota';studentEmail.textContent=user.email||'-';loginView.classList.add('hidden');studentView.classList.remove('hidden');syncCbtState(user,name)};
  onAuthStateChanged(auth,async user=>{
    if(!user){showLogin();return}
    if(loginInFlight)return;
    const saved=sessionStorage.getItem('pnStudentUsername')||String(user.displayName||'').trim();
    if(!saved){try{await signOut(auth)}catch(_){};return}
    try{await authorizeCbt(user,saved);showStudent(user,saved)}catch(err){loginError.textContent=err.message||'Akun Anda belum dijadwalkan CBT.';try{await signOut(auth)}catch(_){}}
  });
  form.addEventListener('submit',async e=>{
    e.preventDefault();loginError.textContent='';loginBtn.disabled=true;loginBtn.textContent='MEMERIKSA JADWAL...';
    const uname=username.value.trim();loginInFlight=true;
    try{
      const cred=await signInWithEmailAndPassword(auth,email.value.trim(),password.value);
      const display=String(cred.user.displayName||'').trim();
      if(display && display.toLowerCase()!==uname.toLowerCase())throw new Error('Username tidak sesuai dengan akun tersebut.');
      await authorizeCbt(cred.user,uname);
      sessionStorage.setItem('pnStudentUsername',uname);showStudent(cred.user,uname);
    }catch(err){sessionStorage.removeItem('pnStudentUsername');loginError.textContent=err?.message||'Username, email, atau password salah / akun belum dijadwalkan.';try{await signOut(auth)}catch(_){}}
    finally{loginInFlight=false;loginBtn.disabled=false;loginBtn.textContent='MASUK PORTAL CBT ONLINE'}
  });
"""
if old_auth in siswa:
    siswa = siswa.replace(old_auth, new_auth, 1)
elif "MEMERIKSA JADWAL" not in siswa:
    raise SystemExit('Blok login CBT siswa tidak ditemukan')

# =========================================================
# ADMIN CBT TOGGLE: add schedule manager button
# =========================================================
if "ATUR PESERTA / JADWAL" not in toggle:
    old_css = ".pnCbtLinkHelp{display:block;margin-top:6px;color:#64748b;font-size:9px;line-height:1.45}\n"
    new_css = old_css + "  .pnCbtScheduleLink{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:9px;padding:9px 12px;background:#14532d;color:#fff;font-size:10px;font-weight:1000;white-space:nowrap}\n"
    if old_css not in toggle:
        raise SystemExit('Marker CSS link CBT tidak ditemukan')
    toggle = toggle.replace(old_css, new_css, 1)
    old_html = '<button id="pnCbtSaveLink" class="pnCbtLinkSave" type="button">SIMPAN LINK</button></div><span id="pnCbtLinkHelp" class="pnCbtLinkHelp">Tempel link Google Form baru lalu klik SIMPAN LINK.</span>'
    new_html = '<button id="pnCbtSaveLink" class="pnCbtLinkSave" type="button">SIMPAN LINK</button><a class="pnCbtScheduleLink" href="jadwal-cbt.html">🗓 ATUR PESERTA / JADWAL</a></div><span id="pnCbtLinkHelp" class="pnCbtLinkHelp">Tempel link Google Form baru lalu klik SIMPAN LINK.</span>'
    if old_html not in toggle:
        raise SystemExit('Marker HTML link CBT tidak ditemukan')
    toggle = toggle.replace(old_html, new_html, 1)

code_path.write_text(code, encoding='utf-8')
siswa_path.write_text(siswa, encoding='utf-8')
toggle_path.write_text(toggle, encoding='utf-8')
print('CBT schedule v1 installed')
