from pathlib import Path

index = Path('index.html')
text = index.read_text(encoding='utf-8')

# Paksa browser memakai script moderasi terbaru.
for v in range(2, 11):
    text = text.replace(f'js/reviews-moderation-v2.js?v={v}', 'js/reviews-moderation-v2.js?v=10')

# Pembaca publik GET/JSONP terbaru.
for v in range(3, 8):
    text = text.replace(f'js/reviews-public-refresh-v3.js?v={v}', 'js/reviews-public-refresh-v3.js?v=7')

legacy_start = text.find('<script>\n/* REVIEWS SCRIPT V41 */')
modern_marker = '<script src="js/reviews-moderation-v2.js?v=10"></script>'
if legacy_start != -1:
    # Cari varian marker moderasi yang mungkin masih lama.
    candidates = [
        '<script src="js/reviews-moderation-v2.js?v=10"></script>',
        '<script src="js/reviews-moderation-v2.js?v=6"></script>',
    ]
    modern_start = -1
    matched = ''
    for c in candidates:
        pos = text.find(c, legacy_start)
        if pos != -1:
            modern_start = pos
            matched = c
            break
    if modern_start == -1:
        raise SystemExit('Modern review script marker not found after legacy block')
    text = text[:legacy_start] + modern_marker + text[modern_start + len(matched):]

# Login admin cepat v9: recovery lama tidak diperlukan.
text = text.replace('<script src="js/reviews-admin-recovery-v7.js?v=7"></script>\n', '')
text = text.replace('<script src="js/reviews-admin-direct-v8.js?v=8"></script>', '<script src="js/reviews-admin-direct-v8.js?v=9"></script>')

fast_marker = '<script src="js/reviews-admin-direct-v8.js?v=9"></script>'
public_marker = '<script src="js/reviews-public-refresh-v3.js?v=7"></script>'
if fast_marker not in text:
    if public_marker not in text:
        raise SystemExit('Public review script marker not found')
    text = text.replace(public_marker, fast_marker + '\n' + public_marker)

index.write_text(text, encoding='utf-8')

js_path = Path('js/reviews-moderation-v2.js')
js = js_path.read_text(encoding='utf-8')

# Pastikan tombol buka/tutup form tetap berfungsi.
marker = "  const note=form.querySelector('.reviewFormNote');\n  if(note)note.textContent='Ulasan disimpan ke database pusat dan tidak langsung tampil. Admin akan memeriksa lalu memilih Terbitkan, Tolak, atau Hapus.';\n"
insert = marker + "\n  const openBtn=$('reviewOpenBtn');\n  const closeBtn=$('reviewCloseBtn');\n  const wrap=$('reviewFormWrap');\n  if(openBtn&&!openBtn.dataset.reviewProBound){\n    openBtn.dataset.reviewProBound='1';\n    openBtn.addEventListener('click',()=>{wrap?.classList.add('open');setTimeout(()=>wrap?.scrollIntoView({behavior:'smooth',block:'nearest'}),50);});\n  }\n  if(closeBtn&&!closeBtn.dataset.reviewProBound){\n    closeBtn.dataset.reviewProBound='1';\n    closeBtn.addEventListener('click',()=>wrap?.classList.remove('open'));\n  }\n"
if "openBtn.dataset.reviewProBound='1'" not in js:
    if marker not in js:
        raise SystemExit('Review form marker not found')
    js = js.replace(marker, insert)

# Ganti transport POST iframe agar browser HP tidak menampilkan gagal palsu.
start = js.find('function request(action,payload={}){')
end_marker = '\n\nfunction setFormStatus(type,text){'
end = js.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit('request() review transport block not found')

new_request = r'''function request(action,payload={}){
  return new Promise((resolve,reject)=>{
    const rid='pnreview-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const frame=document.createElement('iframe');
    frame.name='pnReviewFrame_'+rid.replace(/[^a-zA-Z0-9_]/g,'');
    frame.style.display='none';
    frame.setAttribute('aria-hidden','true');
    const form=document.createElement('form');
    form.method='POST';
    form.action=REVIEW_ENDPOINT;
    form.target=frame.name;
    form.style.display='none';
    Object.entries({action,rid,...payload}).forEach(([name,value])=>{
      const input=document.createElement('input');
      input.type='hidden';input.name=name;input.value=String(value??'');
      form.appendChild(input);
    });

    let done=false;
    let submitStartedAt=0;
    let loadFallbackTimer=0;

    const cleanup=()=>{
      window.removeEventListener('message',onMessage);
      frame.removeEventListener('load',onLoad);
      clearTimeout(timer);
      clearTimeout(loadFallbackTimer);
      form.remove();
      setTimeout(()=>frame.remove(),250);
    };

    const finishOk=data=>{
      if(done)return;
      done=true;cleanup();resolve(data||{ok:true});
    };

    const onMessage=e=>{
      const d=e.data;
      if(done||!d||d.source!==REVIEW_SOURCE||d.rid!==rid)return;
      if(d.ok)finishOk(d);
      else{
        done=true;cleanup();reject(new Error(d.message||'Permintaan gagal.'));
      }
    };

    // iOS/HP tertentu menyimpan POST dengan benar tetapi postMessage dari
    // iframe Apps Script tidak sampai. Jika halaman respons POST sudah selesai
    // dimuat, khusus reviewSubmit kita anggap permintaan telah diterima server.
    const onLoad=()=>{
      if(done||action!=='reviewSubmit'||!submitStartedAt)return;
      if(Date.now()-submitStartedAt<500)return; // abaikan about:blank awal iframe
      clearTimeout(loadFallbackTimer);
      loadFallbackTimer=setTimeout(()=>{
        finishOk({ok:true,assumed:true,id:'',status:'PENDING'});
      },600);
    };

    window.addEventListener('message',onMessage);
    frame.addEventListener('load',onLoad);

    const timer=setTimeout(()=>{
      if(done)return;
      done=true;cleanup();
      reject(new Error('Server belum menyelesaikan permintaan. Coba lagi setelah beberapa saat.'));
    },45000);

    document.body.appendChild(frame);
    document.body.appendChild(form);
    submitStartedAt=Date.now();
    form.submit();
  });
}'''

js = js[:start] + new_request + js[end:]

# Pesan sukses jangan mewajibkan ID jika browser memakai fallback onload.
old_success = "      setFormStatus('ok','✓ Ulasan tersimpan dengan ID '+String(r.id||'')+'. Status: MENUNGGU VERIFIKASI ADMIN.');"
new_success = "      setFormStatus('ok',r.assumed?'✓ Ulasan telah dikirim ke database. Status: MENUNGGU VERIFIKASI ADMIN.':'✓ Ulasan tersimpan dengan ID '+String(r.id||'')+'. Status: MENUNGGU VERIFIKASI ADMIN.');"
if old_success in js:
    js = js.replace(old_success, new_success)

js_path.write_text(js, encoding='utf-8')

print('Review transport v10: mobile iframe completion fallback, 45s timeout, cache bust, public GET reader v7.')
