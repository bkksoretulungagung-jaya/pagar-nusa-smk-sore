from pathlib import Path

js=Path('js/database-cloud-v1.js')
s=js.read_text()

if "PN_DB_LAST_SYNC_KEY" not in s:
    s=s.replace("const PN_DB_PENDING_KEY='pnExcelCloudPendingV2';\n", "const PN_DB_PENDING_KEY='pnExcelCloudPendingV2';\nconst PN_DB_LAST_SYNC_KEY='pnExcelCloudLastSyncV1';\n", 1)

anchor="""function pnSetPending(value){
  try{
    if(value)localStorage.setItem(PN_DB_PENDING_KEY,String(value));
    else localStorage.removeItem(PN_DB_PENDING_KEY);
  }catch(_){}
}
"""
helper="""function pnLastSyncStored(){
  try{return localStorage.getItem(PN_DB_LAST_SYNC_KEY)||''}catch(_){return''}
}
function pnParseWibTime(value){
  const raw=String(value||'').trim();
  if(!raw)return null;
  const normalized=/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}$/.test(raw)?raw+'+07:00':raw;
  const d=new Date(normalized);
  return Number.isNaN(d.getTime())?null:d;
}
function pnFormatWibTime(value){
  const d=pnParseWibTime(value);
  if(!d)return '';
  const date=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).format(d);
  const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(d).replace(/\\./g,':');
  return date+' • '+time+' WIB';
}
function pnEnsureLastSyncElement(){
  let el=document.getElementById('pnLastSync');
  if(el)return el;
  const name=document.getElementById('dbName');
  const picker=name&&name.closest('.picker');
  if(!picker)return null;
  el=document.createElement('div');
  el.id='pnLastSync';
  el.style.cssText='margin:10px 0 0;padding:9px 11px;border:1px solid #dbe7df;border-radius:9px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.5';
  el.innerHTML='<b>🕒 Sinkronisasi terakhir:</b> belum ada';
  picker.insertAdjacentElement('afterend',el);
  return el;
}
function pnRenderLastSync(state='idle',value=''){
  const el=pnEnsureLastSyncElement();
  if(!el)return;
  if(value){try{localStorage.setItem(PN_DB_LAST_SYNC_KEY,String(value))}catch(_){}}
  const saved=value||pnLastSyncStored();
  const when=pnFormatWibTime(saved);
  let suffix='',color='#475569',background='#f8fafc',border='#dbe7df';
  if(state==='pending'){suffix=' • menyinkronkan perubahan terbaru…';color='#92400e';background='#fff7ed';border='#fed7aa'}
  else if(state==='error'){suffix=' • perubahan terbaru belum tersinkron';color='#991b1b';background='#fef2f2';border='#fecaca'}
  else if(when){color='#166534';background='#ecfdf3';border='#bbf7d0'}
  el.style.color=color;el.style.background=background;el.style.borderColor=border;
  el.innerHTML='<b>🕒 Sinkronisasi terakhir:</b> '+(when||'belum ada')+suffix;
}
function pnSetLastSync(value){pnRenderLastSync('ok',value||new Date().toISOString())}
"""
if "function pnLastSyncStored()" not in s:
    if anchor not in s: raise SystemExit('pending anchor not found')
    s=s.replace(anchor,anchor+helper,1)

old="""    pnSetPending('');
    pnCloudStatus();
    setStatus('✓ Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama siap digunakan dari perangkat ini.','ok');
"""
new="""    pnSetPending('');
    pnCloudStatus();
    pnSetLastSync(result.updatedAt);
    setStatus('✓ Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama siap digunakan dari perangkat ini.','ok');
"""
if old in s:s=s.replace(old,new,1)

old="""  pnCloudLoaded=true;
  pnCloudCheckedToken=token;
  pnCloudLoadedToken=token;
  pnCloudStatus();
  return result;
"""
new="""  pnCloudLoaded=true;
  pnCloudCheckedToken=token;
  pnCloudLoadedToken=token;
  pnCloudStatus();
  pnSetLastSync(result.updatedAt);
  return result;
"""
if old in s:s=s.replace(old,new,1)

old="""  const generation=pnCloudGeneration;
  pnCloudStatus('SINKRON CLOUD...');
"""
new="""  const generation=pnCloudGeneration;
  pnCloudStatus('SINKRON CLOUD...');
  pnRenderLastSync('pending');
"""
if old in s:s=s.replace(old,new,1)

old="""    pnSetPending('update');
    pnCloudStatus('CLOUD TERTUNDA');
    setStatus('Data sudah aman di perangkat ini. Sinkronisasi cloud akan dicoba lagi otomatis: <b>'+esc(err.message)+'</b>','err');
"""
new="""    pnSetPending('update');
    pnCloudStatus('CLOUD TERTUNDA');
    pnRenderLastSync('error');
    setStatus('Data sudah aman di perangkat ini. Sinkronisasi cloud akan dicoba lagi otomatis: <b>'+esc(err.message)+'</b>','err');
"""
if old in s:s=s.replace(old,new,1)

old="""  if(markChange)pnCloudGeneration++;
  if(pnPending()!=='initial')pnSetPending('update');
"""
new="""  if(markChange)pnCloudGeneration++;
  if(pnPending()!=='initial')pnSetPending('update');
  if(markChange)pnRenderLastSync('pending');
"""
if old in s:s=s.replace(old,new,1)

old="""setTimeout(pnMaybeLoadCloud,700);
setInterval(pnMaybeLoadCloud,2500);
"""
new="""setTimeout(()=>pnRenderLastSync('idle'),120);
setTimeout(pnMaybeLoadCloud,700);
setInterval(pnMaybeLoadCloud,2500);
"""
if old in s:s=s.replace(old,new,1)

js.write_text(s)

idx=Path('index.html')
h=idx.read_text()
if 'js/database-cloud-v1.js?v=5' in h:
    h=h.replace('js/database-cloud-v1.js?v=5','js/database-cloud-v1.js?v=6',1)
elif 'js/database-cloud-v1.js?v=6' not in h:
    raise SystemExit('cloud loader not found')
idx.write_text(h)
