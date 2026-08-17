from pathlib import Path

js_path = Path('js/database-cloud-v1.js')
text = js_path.read_text(encoding='utf-8')
old = """  pnSetPending('initial');\n  pnCloudStatus('UPLOAD CLOUD...');\n\n  pnInitialUploadPromise=(async()=>{\n    try{\n      setStatus('Mengunggah database utama ke server untuk pertama kali. <b>Aplikasi tetap dapat digunakan selama proses berjalan.</b>');\n      const out=pnInitialUploadBytes(rawBytes);\n"""
new = """  pnInitialUploadPromise=(async()=>{\n    try{\n      // Selalu cek master cloud terlebih dahulu. Ini membersihkan status upload lama\n      // dan mencegah workbook besar dikirim ulang jika master sudah ada di Drive.\n      try{\n        const existing=await pnDatabasePost('databaseManifest',{token},15000);\n        if(existing&&existing.exists){\n          pnSetPending('');\n          setStatus('Database utama sudah tersedia di <b>SERVER CLOUD</b>. Memuat master cloud tanpa upload ulang...','ok');\n          const loaded=await pnRestoreCloudDatabase({quiet:false});\n          if(loaded)return true;\n          throw new Error('Master cloud ditemukan tetapi belum berhasil dimuat.');\n        }\n      }catch(checkErr){\n        if(String(checkErr?.message||'').includes('Master cloud ditemukan'))throw checkErr;\n        console.warn('Pemeriksaan master cloud belum selesai:',checkErr);\n      }\n\n      pnSetPending('initial');\n      pnCloudStatus('UPLOAD CLOUD...');\n      setStatus('Mengunggah database utama ke server untuk pertama kali. <b>Aplikasi tetap dapat digunakan selama proses berjalan.</b>');\n      const out=pnInitialUploadBytes(rawBytes);\n"""
if old not in text:
    raise SystemExit('Target pnInitializeCloudFromCurrent tidak ditemukan; batal agar tidak merusak file.')
text = text.replace(old, new, 1)
js_path.write_text(text, encoding='utf-8')

index_path = Path('index.html')
index = index_path.read_text(encoding='utf-8')
if 'js/database-cloud-v1.js?v=3' not in index:
    raise SystemExit('Loader database cloud v3 tidak ditemukan.')
index = index.replace('js/database-cloud-v1.js?v=3', 'js/database-cloud-v1.js?v=4', 1)
index_path.write_text(index, encoding='utf-8')
