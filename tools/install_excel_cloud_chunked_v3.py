from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
backend = ROOT / 'backend' / 'Code.gs'
frontend = ROOT / 'js' / 'database-cloud-v1.js'
index = ROOT / 'index.html'


def replace_once(text, old, new, label):
    if old not in text:
        if new in text:
            return text
        raise SystemExit(f'Pattern tidak ditemukan: {label}')
    return text.replace(old, new, 1)

# --- Backend Apps Script: metadata + chunk download ---
text = backend.read_text(encoding='utf-8')
text = replace_once(
    text,
    "const PN_EXCEL_MAX_BASE64_CHARS = 28 * 1024 * 1024;\n",
    "const PN_EXCEL_MAX_BASE64_CHARS = 28 * 1024 * 1024;\nconst PN_EXCEL_CHUNK_BYTES = 1024 * 1024;\n",
    'backend constant'
)

text = replace_once(
    text,
    "    if (action === 'databaseGet') {\n      result = excelDatabaseGet_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-database');\n    }\n\n",
    "    if (action === 'databaseManifest') {\n      result = excelDatabaseManifest_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-database');\n    }\n\n    if (action === 'databaseChunk') {\n      result = excelDatabaseChunk_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-database');\n    }\n\n    if (action === 'databaseGet') {\n      result = excelDatabaseGet_(data);\n      result.rid = String(data.rid || '');\n      return iframeResult_(result, 'pn-database');\n    }\n\n",
    'backend doPost routes'
)

text = replace_once(
    text,
    "    if (['databaseGet','databaseSave'].includes(action)) {\n",
    "    if (['databaseManifest','databaseChunk','databaseGet','databaseSave'].includes(action)) {\n",
    'backend error route'
)

old_meta = """function excelDatabaseMeta_(file) {
  if (!file) return {exists:false};
  const blob = file.getBlob();
  return {
    exists:true,
    fileId:file.getId(),
    name:file.getName(),
    mimeType:blob.getContentType() || excelDatabaseMime_(file.getName()),
    size:blob.getBytes().length,
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', \"yyyy-MM-dd'T'HH:mm:ss\")
  };
}

function excelDatabaseGet_(data) {
"""
new_meta = """function excelDatabaseMeta_(file) {
  if (!file) return {exists:false};
  const blob = file.getBlob();
  let size = 0;
  try { size = Number(file.getSize()) || 0; } catch (_) {}
  if (!size) size = blob.getBytes().length;
  return {
    exists:true,
    fileId:file.getId(),
    name:file.getName(),
    mimeType:blob.getContentType() || excelDatabaseMime_(file.getName()),
    size:size,
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', \"yyyy-MM-dd'T'HH:mm:ss\")
  };
}

function excelDatabaseManifest_(data) {
  requireReviewAdmin_(data.token);
  const file = excelDatabaseCurrentFile_();
  if (!file) return {ok:true, exists:false, version:'3'};
  const meta = excelDatabaseMeta_(file);
  if (meta.size > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel pusat melebihi batas 20 MB.');
  meta.ok = true;
  meta.version = '3';
  meta.chunkBytes = PN_EXCEL_CHUNK_BYTES;
  meta.chunkCount = Math.ceil(meta.size / PN_EXCEL_CHUNK_BYTES);
  return meta;
}

function excelDatabaseChunk_(data) {
  requireReviewAdmin_(data.token);
  const file = excelDatabaseCurrentFile_();
  if (!file) return {ok:true, exists:false, version:'3'};

  const index = Math.floor(Number(data.index));
  if (!Number.isFinite(index) || index < 0) throw new Error('Index potongan database tidak valid.');

  const bytes = file.getBlob().getBytes();
  if (bytes.length > PN_EXCEL_MAX_BYTES) throw new Error('Database Excel pusat melebihi batas 20 MB.');
  const chunkCount = Math.ceil(bytes.length / PN_EXCEL_CHUNK_BYTES);
  if (index >= chunkCount) throw new Error('Index potongan database di luar batas.');

  const start = index * PN_EXCEL_CHUNK_BYTES;
  const end = Math.min(start + PN_EXCEL_CHUNK_BYTES, bytes.length);
  const part = bytes.slice(start, end);
  return {
    ok:true,
    exists:true,
    version:'3',
    index:index,
    chunkCount:chunkCount,
    size:bytes.length,
    name:file.getName(),
    updatedAt:Utilities.formatDate(file.getLastUpdated(), 'Asia/Jakarta', \"yyyy-MM-dd'T'HH:mm:ss\"),
    base64:Utilities.base64Encode(part)
  };
}

function excelDatabaseGet_(data) {
"""
text = replace_once(text, old_meta, new_meta, 'backend chunk functions')
backend.write_text(text, encoding='utf-8')

# --- Frontend: use manifest + parallel chunks, fallback to legacy whole-file endpoint ---
text = frontend.read_text(encoding='utf-8')
text = replace_once(
    text,
    "const PN_DB_SYNC_DELAY=900;\n",
    "const PN_DB_SYNC_DELAY=900;\nconst PN_DB_DOWNLOAD_CONCURRENCY=3;\n",
    'frontend concurrency constant'
)

old_restore = """async function pnRestoreCloudDatabase(options={}){
  const quiet=!!options.quiet;
  const token=pnDbToken();
  if(!token||pnCloudBusy||pnCloudSaveBusy)return false;

  pnCloudBusy=true;
  pnCloudCheckedToken=token;
  try{
    if(!quiet)setStatus('Menghubungkan database Excel utama dari server...');
    const result=await pnDatabasePost('databaseGet',{token},90000);
    if(!result.exists){
      pnCloudLoaded=false;
      if(!quiet)setStatus('Database Excel pusat belum tersedia. Upload database sekali dari perangkat utama.');
      return false;
    }
    if(!result.base64)throw new Error('Isi database pusat tidak tersedia.');

    const bytes=pnBase64ToArrayBuffer(result.base64);
    fileHandle=null;
    autosaveMode=false;
    await prepareWorkbook(bytes,result.name||'Database_Pagar_Nusa_BROWSER.xlsm');
    await cacheDatabase(bytes,result.name||originalName,null,false);

    pnCloudLoaded=true;
    pnCloudLoadedToken=token;
    dirty=false;
    dirtySheets.clear();
    pnSetPending('');
    pnCloudStatus();
    setStatus('Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama dapat digunakan dari perangkat lain setelah login admin.','ok');
    return true;
  }catch(err){
    console.warn('Database cloud belum dapat dimuat:',err);
    if(!quiet)setStatus('Database cloud belum dapat dimuat: <b>'+esc(err.message)+'</b>. Salinan browser tetap dapat digunakan.','err');
    return false;
  }finally{
    pnCloudBusy=false;
  }
}
window.restoreCloudDatabase=pnRestoreCloudDatabase;
"""
new_restore = """async function pnDownloadCloudWorkbook(token,quiet){
  let manifest;
  try{
    manifest=await pnDatabasePost('databaseManifest',{token},30000);
  }catch(err){
    const msg=String(err?.message||'');
    if(!/Action tidak dikenal|tidak dikenal/i.test(msg))throw err;
    const legacy=await pnDatabasePost('databaseGet',{token},90000);
    if(!legacy.exists)return {exists:false};
    if(!legacy.base64)throw new Error('Isi database pusat tidak tersedia.');
    return {exists:true,name:legacy.name,size:legacy.size,updatedAt:legacy.updatedAt,bytes:pnBase64ToArrayBuffer(legacy.base64)};
  }

  if(!manifest.exists)return {exists:false};
  const count=Number(manifest.chunkCount||0);
  const size=Number(manifest.size||0);
  if(!Number.isInteger(count)||count<1||count>64||!Number.isFinite(size)||size<1)throw new Error('Metadata database cloud tidak valid.');

  const chunks=new Array(count);
  let next=0,done=0;
  const updateProgress=()=>{
    pnCloudStatus('MUAT CLOUD '+done+'/'+count);
    if(!quiet)setStatus('Mengunduh database cloud bertahap: <b>'+done+' / '+count+'</b> bagian...');
  };
  updateProgress();

  async function worker(){
    while(true){
      const index=next++;
      if(index>=count)return;
      const r=await pnDatabasePost('databaseChunk',{token,index},45000);
      if(!r.exists||Number(r.index)!==index||!r.base64)throw new Error('Potongan database cloud '+(index+1)+' tidak valid.');
      chunks[index]=new Uint8Array(pnBase64ToArrayBuffer(r.base64));
      done++;
      updateProgress();
    }
  }

  const workers=[];
  const concurrency=Math.min(PN_DB_DOWNLOAD_CONCURRENCY,count);
  for(let i=0;i<concurrency;i++)workers.push(worker());
  await Promise.all(workers);

  const out=new Uint8Array(size);
  let offset=0;
  for(const part of chunks){
    if(!part)throw new Error('Database cloud belum lengkap.');
    if(offset+part.length>out.length)throw new Error('Ukuran database cloud tidak sesuai metadata.');
    out.set(part,offset);
    offset+=part.length;
  }
  if(offset!==size)throw new Error('Database cloud tidak lengkap ('+offset+' dari '+size+' byte).');

  return {exists:true,name:manifest.name,size,updatedAt:manifest.updatedAt,bytes:out.buffer};
}

async function pnRestoreCloudDatabase(options={}){
  const quiet=!!options.quiet;
  const token=pnDbToken();
  if(!token||pnCloudBusy||pnCloudSaveBusy)return false;

  pnCloudBusy=true;
  pnCloudCheckedToken=token;
  try{
    if(!quiet)setStatus('Menghubungkan database Excel utama dari server...');
    const result=await pnDownloadCloudWorkbook(token,quiet);
    if(!result.exists){
      pnCloudLoaded=false;
      if(!quiet)setStatus('Database Excel pusat belum tersedia. Upload database sekali dari perangkat utama.');
      return false;
    }

    const bytes=result.bytes;
    fileHandle=null;
    autosaveMode=false;
    await prepareWorkbook(bytes,result.name||'Database_Pagar_Nusa_BROWSER.xlsm');
    await cacheDatabase(bytes,result.name||originalName,null,false);

    pnCloudLoaded=true;
    pnCloudLoadedToken=token;
    dirty=false;
    dirtySheets.clear();
    pnSetPending('');
    pnCloudStatus();
    setStatus('✓ Database utama dimuat dari <b>SERVER CLOUD</b>. Data yang sama siap digunakan dari perangkat ini.','ok');
    return true;
  }catch(err){
    console.warn('Database cloud belum dapat dimuat:',err);
    pnCloudStatus('CLOUD GAGAL');
    if(!quiet)setStatus('Database cloud belum dapat dimuat: <b>'+esc(err.message)+'</b>. Salinan browser tetap dapat digunakan.','err');
    return false;
  }finally{
    pnCloudBusy=false;
  }
}
window.restoreCloudDatabase=pnRestoreCloudDatabase;
"""
text = replace_once(text, old_restore, new_restore, 'frontend restore chunked')

# After a slow initial upload, confirm the master via lightweight manifest instead of looping upload.
old_catch = """    }catch(err){
      if(err.data&&err.data.code==='MASTER_EXISTS'){
        pnSetPending('');
        setStatus('Database utama sudah ada di server. File dari perangkat ini <b>TIDAK MENIMPA</b> database pusat. Memuat database pusat...','ok');
        await pnRestoreCloudDatabase({quiet:false});
        return true;
      }
      console.error(err);
      pnCloudStatus('CLOUD TERTUNDA');
      setStatus('Upload database pusat belum selesai: <b>'+esc(err.message)+'</b>. Data lokal tetap aman dan akan dicoba lagi otomatis.','err');
      return false;
"""
new_catch = """    }catch(err){
      if(err.data&&err.data.code==='MASTER_EXISTS'){
        pnSetPending('');
        setStatus('Database utama sudah ada di server. File dari perangkat ini <b>TIDAK MENIMPA</b> database pusat. Memuat database pusat...','ok');
        await pnRestoreCloudDatabase({quiet:false});
        return true;
      }
      try{
        const check=await pnDatabasePost('databaseManifest',{token},30000);
        if(check&&check.exists){
          pnCloudLoaded=true;
          pnCloudLoadedToken=token;
          pnSetPending('');
          pnCloudStatus();
          setStatus('✓ Database utama sudah tersimpan di <b>SERVER CLOUD</b>. Konfirmasi upload diterima setelah pemeriksaan server.','ok');
          return true;
        }
      }catch(_){}
      console.error(err);
      pnCloudStatus('CLOUD TERTUNDA');
      setStatus('Upload database pusat belum selesai: <b>'+esc(err.message)+'</b>. Data lokal tetap aman dan akan dicoba lagi otomatis.','err');
      return false;
"""
text = replace_once(text, old_catch, new_catch, 'frontend upload confirm')
frontend.write_text(text, encoding='utf-8')

# Bump cache-busting query.
html = index.read_text(encoding='utf-8')
html = replace_once(
    html,
    '<script src="js/database-cloud-v1.js?v=1"></script>',
    '<script src="js/database-cloud-v1.js?v=3"></script>',
    'index cache bust'
)
index.write_text(html, encoding='utf-8')

print('Excel Cloud V3 chunked patch installed.')
