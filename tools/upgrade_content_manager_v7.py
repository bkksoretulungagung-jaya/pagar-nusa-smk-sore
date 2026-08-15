from pathlib import Path

p=Path('backend/Code.gs')
text=p.read_text(encoding='utf-8')
orig=text

# Constants
marker="const PN_REVIEW_SHEET_NAME = 'Ulasan Website';\n"
consts=(
"const PN_CONTENT_SHEET_NAME = 'Konten Website';\n"
"const PN_GALLERY_SHEET_NAME = 'Galeri Website';\n"
"const PN_CONTENT_FOLDER_ID = '1DaUWvaUAMTIPm1PbVdrQilv83vN6XMKv';\n"
)
if 'PN_CONTENT_SHEET_NAME' not in text:
    if marker not in text: raise SystemExit('constant marker not found')
    text=text.replace(marker, marker+consts,1)

# Health
text=text.replace("      reviewVersion:'6'\n", "      reviewVersion:'6',\n      content:true,\n      contentVersion:'1'\n",1)

# GET routes before register
get_marker="  if (action === 'register') {\n"
get_routes="""  if (action === 'contentPublicList') {
    let result;
    try {
      result = contentPublicList_();
    } catch (err) {
      result = {ok:false, content:[], gallery:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'contentAdminList') {
    let result;
    try {
      result = contentAdminList_(data);
    } catch (err) {
      result = {ok:false, content:[], gallery:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

  if (action === 'contentResult') {
    let result;
    try {
      result = contentResult_(data);
    } catch (err) {
      result = {ok:false, message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

"""
if "action === 'contentPublicList'" not in text:
    if get_marker not in text: raise SystemExit('GET marker not found')
    text=text.replace(get_marker,get_routes+get_marker,1)

# POST routes before unknown action
post_marker="    return json_({ok:false, message:'Action tidak dikenal.'});\n  } catch (err) {\n"
post_routes="""    if (action === 'contentAdminLogin') {
      result = reviewAdminLogin_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminSave') {
      result = contentAdminSave_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminDelete') {
      result = contentAdminDelete_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentAdminSeed') {
      result = contentAdminSeed_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

    if (action === 'contentUploadImage') {
      result = contentUploadImage_(data);
      result.rid = String(data.rid || '');
      contentRememberResult_(data.rid, result);
      return iframeResult_(result, 'pn-content');
    }

"""
if "action === 'contentAdminSave'" not in text:
    if post_marker not in text: raise SystemExit('POST marker not found')
    text=text.replace(post_marker,post_routes+post_marker,1)

# Catch content errors: remember result and iframe response.
catch_marker="    if (['reviewSubmit','reviewPublicList','reviewAdminLogin','reviewAdminList','reviewModerate'].includes(action)) {\n      return iframeResult_(result, 'pn-reviews');\n    }\n"
catch_new=catch_marker+"    if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage'].includes(action)) {\n      contentRememberResult_(data.rid, result);\n      return iframeResult_(result, 'pn-content');\n    }\n"
if "contentAdminSeed','contentUploadImage" not in text:
    if catch_marker not in text: raise SystemExit('catch marker not found')
    text=text.replace(catch_marker,catch_new,1)

# Main CMS backend functions
func_marker='function sha256Hex_(text) {'
functions=r'''
/* =========================================================
   CONTENT MANAGER / CMS V1
========================================================= */
function contentSheets_() {
  const book = SpreadsheetApp.openById(PN_REG_SPREADSHEET_ID);
  let content = book.getSheetByName(PN_CONTENT_SHEET_NAME);
  let gallery = book.getSheetByName(PN_GALLERY_SHEET_NAME);
  if (!content) {
    content = book.insertSheet(PN_CONTENT_SHEET_NAME);
    content.appendRow(['ID','Jenis','Judul','Ringkasan','Isi / Informasi','Tanggal','Badge','Link','Status','Urutan','Diperbarui Oleh','Waktu Update']);
    content.setFrozenRows(1);
  }
  if (!gallery) {
    gallery = book.insertSheet(PN_GALLERY_SHEET_NAME);
    gallery.appendRow(['ID','Judul / Keterangan','URL Gambar','Drive File ID','Status','Urutan','Diperbarui Oleh','Waktu Update','Alt Text','Catatan']);
    gallery.setFrozenRows(1);
  }
  return {book:book, content:content, gallery:gallery};
}

function contentPublicList_() {
  const sheets = contentSheets_();
  return {
    ok:true,
    content:contentReadContent_(sheets.content, false),
    gallery:contentReadGallery_(sheets.gallery, false),
    version:'1'
  };
}

function contentAdminList_(data) {
  const admin = requireReviewAdmin_(data.token);
  const sheets = contentSheets_();
  return {
    ok:true,
    admin:admin,
    content:contentReadContent_(sheets.content, true),
    gallery:contentReadGallery_(sheets.gallery, true),
    version:'1'
  };
}

function contentReadContent_(sheet, includeHidden) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2,1,last-1,12).getValues();
  return rows.map(function(r){
    return {
      id:String(r[0]||''),
      type:String(r[1]||'BERITA'),
      title:String(r[2]||''),
      summary:String(r[3]||''),
      body:String(r[4]||''),
      date:contentDateText_(r[5]),
      badge:String(r[6]||''),
      link:String(r[7]||''),
      status:String(r[8]||'DRAFT').toUpperCase(),
      order:Number(r[9]||999),
      updatedBy:String(r[10]||''),
      updatedAt:contentDateTimeText_(r[11])
    };
  }).filter(function(x){
    if (!x.id || !x.title || x.status === 'DIHAPUS') return false;
    return includeHidden || x.status === 'PUBLIK' || x.status === 'AKTIF';
  }).sort(function(a,b){
    return (a.order-b.order) || String(b.date).localeCompare(String(a.date));
  });
}

function contentReadGallery_(sheet, includeHidden) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const rows = sheet.getRange(2,1,last-1,10).getValues();
  return rows.map(function(r){
    return {
      id:String(r[0]||''),
      title:String(r[1]||''),
      url:String(r[2]||''),
      fileId:String(r[3]||''),
      status:String(r[4]||'DRAFT').toUpperCase(),
      order:Number(r[5]||999),
      updatedBy:String(r[6]||''),
      updatedAt:contentDateTimeText_(r[7]),
      alt:String(r[8]||''),
      note:String(r[9]||'')
    };
  }).filter(function(x){
    if (!x.id || !x.url || x.status === 'DIHAPUS') return false;
    return includeHidden || x.status === 'PUBLIK' || x.status === 'AKTIF';
  }).sort(function(a,b){ return a.order-b.order; });
}

function contentDateText_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,'Asia/Jakarta','yyyy-MM-dd');
  return String(v||'');
}

function contentDateTimeText_(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return Utilities.formatDate(v,'Asia/Jakarta',"yyyy-MM-dd'T'HH:mm:ss");
  return String(v||'');
}

function contentCleanStatus_(v) {
  const s=String(v||'DRAFT').trim().toUpperCase();
  return ['PUBLIK','AKTIF','DRAFT','DIHAPUS'].includes(s) ? s : 'DRAFT';
}

function contentAdminSave_(data) {
  const admin = requireReviewAdmin_(data.token);
  const section = String(data.section||'').trim().toLowerCase();
  let item;
  try { item = JSON.parse(String(data.itemJson||'{}')); } catch (_) { throw new Error('Data konten tidak valid.'); }
  const saved = contentSaveItem_(section, item, admin);
  return {ok:true, section:section, item:saved, message:'Konten berhasil disimpan.'};
}

function contentSaveItem_(section, item, admin) {
  const sheets = contentSheets_();
  const now = new Date();
  if (section === 'content') {
    let id = String(item.id||'').trim();
    if (!id) id='CNT-'+now.getTime()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const title=sanitize_(String(item.title||'').trim()).slice(0,160);
    if (!title) throw new Error('Judul konten wajib diisi.');
    const type=sanitize_(String(item.type||'BERITA').trim().toUpperCase()).slice(0,30);
    const summary=sanitize_(String(item.summary||'').trim()).slice(0,700);
    const body=sanitize_(String(item.body||'').trim()).slice(0,6000);
    const date=sanitize_(String(item.date||'').trim()).slice(0,40);
    const badge=sanitize_(String(item.badge||type).trim()).slice(0,30);
    const link=sanitize_(String(item.link||'').trim()).slice(0,500);
    const status=contentCleanStatus_(item.status);
    const order=Math.max(1,Math.min(999,Number(item.order||999)));
    const row=[id,type,title,summary,body,date,badge,link,status,order,admin,now];
    contentUpsertRow_(sheets.content,id,row,12);
    return {id:id,type:type,title:title,summary:summary,body:body,date:date,badge:badge,link:link,status:status,order:order};
  }
  if (section === 'gallery') {
    let id=String(item.id||'').trim();
    if (!id) id='GAL-'+now.getTime()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
    const title=sanitize_(String(item.title||'Dokumentasi Kegiatan Pagar Nusa').trim()).slice(0,160);
    const url=String(item.url||'').trim().slice(0,1000);
    if (!url) throw new Error('URL foto tidak tersedia.');
    const fileId=String(item.fileId||'').trim().slice(0,200);
    const status=contentCleanStatus_(item.status);
    const order=Math.max(1,Math.min(999,Number(item.order||999)));
    const alt=sanitize_(String(item.alt||title).trim()).slice(0,180);
    const note=sanitize_(String(item.note||'').trim()).slice(0,300);
    const row=[id,title,url,fileId,status,order,admin,now,alt,note];
    contentUpsertRow_(sheets.gallery,id,row,10);
    return {id:id,title:title,url:url,fileId:fileId,status:status,order:order,alt:alt,note:note};
  }
  throw new Error('Bagian konten tidak dikenal.');
}

function contentUpsertRow_(sheet, id, row, width) {
  const last=sheet.getLastRow();
  let target=0;
  if (last>=2) {
    const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
    for (let i=0;i<ids.length;i++) if (String(ids[i][0]||'').trim()===id) { target=i+2; break; }
  }
  if (target) sheet.getRange(target,1,1,width).setValues([row]);
  else sheet.getRange(last+1,1,1,width).setValues([row]);
}

function contentAdminDelete_(data) {
  const admin=requireReviewAdmin_(data.token);
  const section=String(data.section||'').trim().toLowerCase();
  const id=String(data.id||'').trim();
  if (!id) throw new Error('ID konten tidak tersedia.');
  const sheets=contentSheets_();
  const sheet=section==='content'?sheets.content:section==='gallery'?sheets.gallery:null;
  if (!sheet) throw new Error('Bagian konten tidak dikenal.');
  const last=sheet.getLastRow();
  if (last<2) throw new Error('Data tidak ditemukan.');
  const ids=sheet.getRange(2,1,last-1,1).getDisplayValues();
  let row=0;
  for (let i=0;i<ids.length;i++) if (String(ids[i][0]||'').trim()===id) { row=i+2; break; }
  if (!row) throw new Error('Data tidak ditemukan.');
  const statusCol=section==='content'?9:5;
  const byCol=section==='content'?11:7;
  const timeCol=section==='content'?12:8;
  sheet.getRange(row,statusCol).setValue('DIHAPUS');
  sheet.getRange(row,byCol).setValue(admin);
  sheet.getRange(row,timeCol).setValue(new Date());
  return {ok:true,id:id,section:section,message:'Data dihapus dari tampilan publik.'};
}

function contentAdminSeed_(data) {
  const admin=requireReviewAdmin_(data.token);
  const sheets=contentSheets_();
  if (sheets.content.getLastRow()>=2 || sheets.gallery.getLastRow()>=2) return {ok:true,skipped:true,message:'Database konten sudah berisi data.'};
  let content=[],gallery=[];
  try { content=JSON.parse(String(data.contentJson||'[]')); } catch (_) {}
  try { gallery=JSON.parse(String(data.galleryJson||'[]')); } catch (_) {}
  if (!Array.isArray(content)) content=[];
  if (!Array.isArray(gallery)) gallery=[];
  content.slice(0,30).forEach(function(x){ contentSaveItem_('content',x,admin); });
  gallery.slice(0,30).forEach(function(x){ contentSaveItem_('gallery',x,admin); });
  return {ok:true,seededContent:content.length,seededGallery:gallery.length,message:'Konten awal berhasil diimpor.'};
}

function contentUploadImage_(data) {
  const admin=requireReviewAdmin_(data.token);
  const mime=String(data.mimeType||'').trim().toLowerCase();
  if (!['image/jpeg','image/png','image/webp'].includes(mime)) throw new Error('Format foto harus JPG, PNG, atau WEBP.');
  let raw=String(data.base64||'').trim();
  raw=raw.replace(/^data:image\/[a-z0-9.+-]+;base64,/i,'');
  if (!raw) throw new Error('Data foto tidak tersedia.');
  if (raw.length>5000000) throw new Error('Ukuran foto terlalu besar. Maksimal sekitar 3,5 MB setelah kompresi.');
  const bytes=Utilities.base64Decode(raw);
  if (bytes.length>3800000) throw new Error('Ukuran foto terlalu besar. Maksimal sekitar 3,5 MB.');
  let name=String(data.fileName||'foto.jpg').replace(/[^A-Za-z0-9._ -]/g,'_').slice(0,100);
  if (!name) name='foto-'+new Date().getTime()+'.jpg';
  const blob=Utilities.newBlob(bytes,mime,name);
  const folder=DriveApp.getFolderById(PN_CONTENT_FOLDER_ID);
  const file=folder.createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (_) {}
  const id=file.getId();
  const url='https://drive.google.com/uc?export=view&id='+encodeURIComponent(id);
  return {ok:true,fileId:id,url:url,name:file.getName(),uploadedBy:admin,message:'Foto berhasil diupload ke Google Drive.'};
}

function contentRememberResult_(rid, result) {
  rid=String(rid||'').trim();
  if (!rid) return;
  try { CacheService.getScriptCache().put('pn-content-result:'+rid,JSON.stringify(result),300); } catch (_) {}
}

function contentResult_(data) {
  const rid=String(data.rid||'').trim();
  if (!rid) return {ok:false,message:'RID tidak tersedia.'};
  const raw=CacheService.getScriptCache().get('pn-content-result:'+rid);
  if (!raw) return {ok:false,pending:true,rid:rid};
  try { return JSON.parse(raw); } catch (_) { return {ok:false,message:'Hasil proses tidak valid.',rid:rid}; }
}

'''
if 'function contentSheets_()' not in text:
    if func_marker not in text: raise SystemExit('function insert marker not found')
    text=text.replace(func_marker,functions+func_marker,1)

if text!=orig:
    p.write_text(text,encoding='utf-8')
    print('Content manager backend v7 installed.')
else:
    print('No backend changes needed.')
