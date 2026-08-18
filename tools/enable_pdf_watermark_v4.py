from pathlib import Path
import re

PORTAL = Path('portal-pengurus.html')
BACKEND = Path('backend/Code.gs')

portal = PORTAL.read_text(encoding='utf-8')
backend = BACKEND.read_text(encoding='utf-8')

# 1) Informasikan watermark pada portal.
old_note = '🔒 Jangan membagikan email dan password. Satu akun menggunakan satu sesi aktif; login baru akan menggantikan sesi lama dan aktivitas download dicatat oleh server.'
new_note = '🔒 Jangan membagikan email dan password. Satu akun menggunakan satu sesi aktif; login baru menggantikan sesi lama. Setiap PDF yang diunduh otomatis diberi watermark nama, email, waktu unduh, dan Trace ID unik; aktivitas download juga dicatat oleh server.'
if old_note in portal:
    portal = portal.replace(old_note, new_note, 1)
elif 'Trace ID unik' not in portal:
    print('WARN: note portal tidak ditemukan')

# 2) Muat pdf-lib versi tetap untuk menulis watermark ke setiap halaman PDF.
pdf_lib_tag = '<script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>'
inline_marker = "<script>\n(()=>{'use strict';"
if pdf_lib_tag not in portal:
    if inline_marker not in portal:
        raise SystemExit('Marker script portal tidak ditemukan')
    portal = portal.replace(inline_marker, pdf_lib_tag + '\n' + inline_marker, 1)

# 3) Ganti routine download portal: PDF wajib diberi watermark; bila watermark gagal, PDF tidak diberikan tanpa watermark.
new_download = r'''function joinBytes(parts){let total=0;for(const p of parts)total+=p.length;const out=new Uint8Array(total);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length}return out}
function isPdfFile(m){return /pdf/i.test(String(m?.mime||''))||/\.pdf$/i.test(String(m?.fileName||''))}
function wmFileName(name){name=String(name||'materi.pdf');if(/\.pdf$/i.test(name))return name.replace(/\.pdf$/i,'-watermark.pdf');return name+'-watermark.pdf'}
function wibText(value){try{return new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).format(new Date(value))+' WIB'}catch(_){return String(value||'')}}
function fitPdfText(font,text,maxWidth,startSize,minSize){let size=startSize;while(size>minSize&&font.widthOfTextAtSize(text,size)>maxWidth)size-=.5;return size}
async function addPdfWatermark(rawBytes,wm){
  if(!window.PDFLib)throw new Error('Mesin watermark PDF belum termuat. Muat ulang halaman lalu coba lagi.');
  const {PDFDocument,StandardFonts,rgb,degrees}=window.PDFLib;
  let pdf;
  try{pdf=await PDFDocument.load(rawBytes)}catch(_){throw new Error('PDF tidak dapat diproses untuk watermark. File PDF tidak diunduh tanpa watermark; hubungi Admin.')}
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const name=String(wm?.name||account?.name||'PENGURUS').replace(/[\r\n]+/g,' ').slice(0,100);
  const email=String(wm?.email||account?.email||'').replace(/[\r\n]+/g,' ').slice(0,120);
  const trace=String(wm?.traceId||'TRACE-TIDAK-TERSEDIA').replace(/[\r\n]+/g,' ').slice(0,80);
  const when=wibText(wm?.downloadedAt||new Date().toISOString());
  const pages=pdf.getPages();
  pages.forEach((page,index)=>{
    const {width,height}=page.getSize();
    const main='KHUSUS PENGURUS - '+name;
    const sub=email+' • '+when;
    const max=Math.max(180,width*.82);
    const mainSize=fitPdfText(bold,main,max,Math.min(24,width/18),9);
    const subSize=fitPdfText(regular,sub,max,Math.min(11,width/34),6.5);
    const markColor=rgb(.55,.10,.10);
    [0.23,0.50,0.77].forEach(pos=>{
      const mw=bold.widthOfTextAtSize(main,mainSize);
      const sw=regular.widthOfTextAtSize(sub,subSize);
      page.drawText(main,{x:Math.max(12,(width-mw)/2-18),y:height*pos,size:mainSize,font:bold,color:markColor,opacity:.13,rotate:degrees(-30)});
      page.drawText(sub,{x:Math.max(12,(width-sw)/2-12),y:height*pos-18,size:subSize,font:regular,color:markColor,opacity:.13,rotate:degrees(-30)});
    });
    const footer='INTERNAL PENGURUS • '+email+' • TRACE '+trace+' • Halaman '+(index+1)+'/'+pages.length;
    const footerSize=fitPdfText(regular,footer,Math.max(120,width-28),7,5.5);
    page.drawRectangle({x:0,y:0,width:width,height:18,color:rgb(.98,.96,.96),opacity:.72});
    page.drawText(footer,{x:10,y:6,size:footerSize,font:regular,color:rgb(.35,.08,.08),opacity:.75});
  });
  try{pdf.setSubject('Materi internal Pagar Nusa - Trace '+trace);pdf.setKeywords(['Pagar Nusa','Pengurus','Trace '+trace]);pdf.setProducer('Portal Pengurus Pagar Nusa SMK Sore Tulungagung')}catch(_){}
  return await pdf.save({useObjectStreams:true});
}
async function download(id,btn){const old=btn.textContent;btn.disabled=true;btn.textContent='0%';status('contentStatus','Menyiapkan file dan identitas download...');try{const token=sessionStorage.getItem(KEY)||'';const m=await jsonp('pengurusMateriManifest',{token,id},15000);if(!m?.ok)throw new Error(m?.message||'File tidak tersedia.');const parts=[],total=Math.max(1,Number(m.totalChunks||1));for(let i=0;i<total;i++){const c=await jsonp('pengurusMateriChunk',{token,id,index:i},20000);if(!c?.ok)throw new Error(c?.message||'File gagal dimuat.');parts.push(b64(String(c.base64||'')));btn.textContent=Math.round((i+1)/total*82)+'%'}let bytes=joinBytes(parts);let fileName=m.fileName||'materi';let mime=m.mime||'application/octet-stream';if(isPdfFile(m)){btn.textContent='WM';status('contentStatus','Menerapkan watermark nama, email, waktu, dan Trace ID ke setiap halaman PDF...');bytes=await addPdfWatermark(bytes,m.watermark||{});fileName=wmFileName(fileName);mime='application/pdf'}const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);const trace=String(m?.watermark?.traceId||'');status('contentStatus',isPdfFile(m)?'✓ PDF ber-watermark berhasil dibuat'+(trace?' • Trace '+trace:''):'✓ Download dimulai.','ok')}catch(e){status('contentStatus',String(e.message||e),'err')}finally{btn.disabled=false;btn.textContent=old}}
'''

pattern = r"async function download\(id,btn\)\{.*?\}\n\$\('loginForm'\)"
match = re.search(pattern, portal, flags=re.S)
if not match:
    if 'async function addPdfWatermark' not in portal:
        raise SystemExit('Routine download portal tidak ditemukan')
else:
    portal = portal[:match.start()] + new_download + "$('loginForm')" + portal[match.end():]

# 4) Backend: health flag untuk verifikasi deployment.
health_anchor = "      pengurusPortalVersion:'2',"
health_add = "      pengurusPortalVersion:'2',\n      pdfWatermark:true,\n      pdfWatermarkVersion:'1',"
if "pdfWatermarkVersion:'1'" not in backend:
    if health_anchor not in backend:
        raise SystemExit('Health anchor backend tidak ditemukan')
    backend = backend.replace(health_anchor, health_add, 1)

# 5) Backend manifest membuat Trace ID dari server, menyimpan log, dan mengirim identitas watermark yang sah.
manifest_pattern = r"function pengurusMateriManifest_\(data\) \{.*?\n\}\n\nfunction pengurusMateriChunk_"
manifest_new = r'''function pengurusMateriManifest_(data) {
  const auth=pengurusRequireSession_(data.token);
  const found=materiFindRow_(data.id);
  const obj=materiObject_(found.values);
  if (obj.status !== 'AKTIF') throw new Error('Materi tidak tersedia.');
  const fileId=String(found.values[6] || '').trim();
  if (!fileId) throw new Error('File materi tidak ditemukan.');
  const file=DriveApp.getFileById(fileId);
  const size=Number(file.getSize() || obj.size || 0);
  const totalChunks=Math.max(1,Math.ceil(size/PN_MATERI_CHUNK_BYTES));
  const downloadedAt=new Date();
  const traceId='PN-'+Utilities.formatDate(downloadedAt,'Asia/Jakarta','yyyyMMdd-HHmmss')+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
  const downloads=Number(found.values[12] || 0);
  found.sheet.getRange(found.row,13,1,2).setValues([[downloads+1,downloadedAt]]);
  const resolvedName=obj.fileName||file.getName();
  const resolvedMime=obj.mime||file.getMimeType();
  const pdf=/pdf/i.test(String(resolvedMime||'')) || /\.pdf$/i.test(String(resolvedName||''));
  pengurusLog_(auth.account,pdf?'DOWNLOAD_PDF_WM':'DOWNLOAD','TRACE '+traceId+' | '+obj.title+' | '+resolvedName);
  return {
    ok:true,
    id:obj.id,
    fileName:resolvedName,
    mime:resolvedMime,
    size:size,
    totalChunks:totalChunks,
    chunkBytes:PN_MATERI_CHUNK_BYTES,
    watermark:{
      enabled:pdf,
      name:String(auth.account.name||''),
      email:String(auth.account.email||''),
      downloadedAt:downloadedAt.toISOString(),
      traceId:traceId
    }
  };
}

function pengurusMateriChunk_'''

m = re.search(manifest_pattern, backend, flags=re.S)
if not m:
    if "DOWNLOAD_PDF_WM" not in backend:
        raise SystemExit('pengurusMateriManifest_ tidak ditemukan')
else:
    backend = backend[:m.start()] + manifest_new + backend[m.end():]

PORTAL.write_text(portal, encoding='utf-8')
BACKEND.write_text(backend, encoding='utf-8')
print('Watermark PDF per akun pengurus V4 aktif')
