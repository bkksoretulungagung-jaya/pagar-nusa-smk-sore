from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / 'biodata.html'
BACKEND = ROOT / 'backend' / 'Biodata.gs'

UKT_CSS = r'''
.uktCard{margin-top:18px;background:#fff;border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.07);overflow:hidden}.uktHead{padding:20px;background:linear-gradient(135deg,#0f3d24,#147a68);color:#fff}.uktHead h2{margin:0;font-size:20px}.uktHead p{margin:6px 0 0;font-size:12px;line-height:1.55;opacity:.94}.uktBody{padding:20px}.uktSummary{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:12px;padding:13px 16px;color:#166534;font-size:12px;font-weight:800}.uktProgress{display:inline-flex;align-items:center;white-space:nowrap;background:#166534;color:#fff;border-radius:999px;padding:6px 11px;font-size:10px;font-weight:900}.uktGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:16px}.uktItem{position:relative;border:1px solid #d9e7dd;border-radius:14px;padding:16px;background:#fbfefc;min-height:190px}.uktItem.pending{background:#f8fafc;border-style:dashed}.uktTop{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.uktTitle{margin:0;color:#14532d;font-size:17px;font-weight:900}.uktBadge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:9px;font-weight:900;white-space:nowrap}.uktBadge.pass{background:#dcfce7;color:#166534}.uktBadge.fail{background:#fee2e2;color:#991b1b}.uktBadge.pending{background:#e2e8f0;color:#475569}.uktDate{margin-top:5px;color:#64748b;font-size:10px;font-weight:700}.uktDetails{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px 12px;margin-top:14px}.uktDetail{font-size:10px;color:#475569}.uktDetail b{display:block;color:#1f2937;font-size:10px;margin-bottom:2px}.uktDetail.full{grid-column:1/-1}.uktEmpty{display:grid;place-items:center;text-align:center;min-height:110px;color:#64748b;font-size:11px;line-height:1.55}.uktEmpty strong{display:block;color:#475569;font-size:12px;margin-bottom:4px}.uktFoot{margin-top:14px;color:#64748b;font-size:10px;line-height:1.55}.uktFoot b{color:#166534}
@media(max-width:700px){.uktSummary{align-items:flex-start;flex-direction:column}.uktGrid{grid-template-columns:1fr}.uktDetails{grid-template-columns:1fr}.uktDetail.full{grid-column:auto}}
'''.strip()

UKT_ARTICLE = r'''  <article id="uktCard" class="uktCard">
    <div class="uktHead"><h2>HASIL UJIAN KENAIKAN TINGKAT (UKT)</h2><p>Riwayat UKT 1 sampai UKT 6 dibaca otomatis dari database sesuai ID Anggota. Data UKT hanya dapat diubah oleh admin.</p></div>
    <div class="uktBody">
      <div id="uktSummary" class="uktSummary"><span>Memuat riwayat UKT...</span><span class="uktProgress">0 / 6 LULUS</span></div>
      <div id="uktGrid" class="uktGrid"></div>
      <div class="uktFoot"><b>Catatan:</b> bila ada ujian ulang pada UKT yang sama, portal menampilkan hasil terbaru yang tercatat di database.</div>
    </div>
  </article>'''

UKT_JS = r'''
function pnUktEsc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function pnUktDate(v){const s=String(v??'').trim();if(!s)return'-';let m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m){m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)m=[m[0],m[3],String(m[2]).padStart(2,'0'),String(m[1]).padStart(2,'0')]}if(!m)return s;const b=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];return `${Number(m[3])} ${b[Number(m[2])-1]||''} ${m[1]}`}
function pnUktSlots(){return Array.from({length:6},(_,i)=>({number:i+1,taken:false,date:'',before:'',result:'',after:'',score:'',notes:'',examiner:''}))}
function renderUkt(data){const summary=$('uktSummary'),grid=$('uktGrid');if(!summary||!grid)return;const slots=Array.isArray(data?.slots)&&data.slots.length?data.slots:pnUktSlots();const completed=Number(data?.completed??slots.filter(x=>x.taken).length);const passed=Number(data?.passed??slots.filter(x=>String(x.result||'').toUpperCase()==='LULUS').length);summary.innerHTML=`<span>${completed?`${completed} tingkat UKT sudah memiliki catatan hasil`:'Belum ada hasil UKT yang tercatat untuk ID Anggota ini'}</span><span class="uktProgress">${passed} / 6 LULUS</span>`;grid.innerHTML=pnUktSlots().map((fallback,i)=>{const x=slots[i]||fallback;const n=Number(x.number||i+1);const result=String(x.result||'').trim().toUpperCase();const taken=!!x.taken||!!result||!!x.date;if(!taken)return `<div class="uktItem pending"><div class="uktTop"><h3 class="uktTitle">UKT ${n}</h3><span class="uktBadge pending">BELUM MENGIKUTI</span></div><div class="uktEmpty"><div><strong>Belum ada hasil UKT ${n}</strong>Data akan muncul otomatis setelah admin mengisi sheet Riwayat UKT.</div></div></div>`;const cls=result==='LULUS'?'pass':(result==='TIDAK LULUS'?'fail':'pending');return `<div class="uktItem"><div class="uktTop"><div><h3 class="uktTitle">UKT ${n}</h3><div class="uktDate">${pnUktEsc(pnUktDate(x.date))}</div></div><span class="uktBadge ${cls}">${pnUktEsc(result||'TERCATAT')}</span></div><div class="uktDetails"><div class="uktDetail"><b>Tingkat Sebelum</b>${pnUktEsc(x.before||'-')}</div><div class="uktDetail"><b>Tingkat/Sabuk Setelah</b>${pnUktEsc(x.after||'-')}</div><div class="uktDetail"><b>Nilai</b>${pnUktEsc(x.score||'-')}</div><div class="uktDetail"><b>Penguji</b>${pnUktEsc(x.examiner||'-')}</div><div class="uktDetail full"><b>Keterangan</b>${pnUktEsc(x.notes||'-')}</div></div></div>`}).join('')}
'''.strip()

UKT_BACKEND_HELPERS = r'''
function emptyUktSlot_(number) {
  return {number:number, ukt:'UKT ' + number, taken:false, date:'', before:'', result:'', after:'', score:'', notes:'', examiner:''};
}

function getStudentUktHistory_(book, memberId) {
  const slots = Array.from({length:PN_UKT_MAX}, (_,i) => emptyUktSlot_(i+1));
  const sheet = book.getSheetByName(PN_UKT_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return {max:PN_UKT_MAX, completed:0, passed:0, latestPassed:0, slots:slots};

  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  const target = String(memberId || '').trim().toLowerCase();
  rows.forEach(r => {
    if (String(r[0] || '').trim().toLowerCase() !== target) return;
    const match = String(r[2] || '').match(/(\d+)/);
    const number = match ? Number(match[1]) : 0;
    if (!number || number < 1 || number > PN_UKT_MAX) return;
    const slot = slots[number-1];
    slot.taken = true;
    slot.date = formatUktDate_(r[3]);
    slot.before = String(r[4] == null ? '' : r[4]);
    slot.result = String(r[5] == null ? '' : r[5]).trim().toUpperCase();
    slot.after = String(r[6] == null ? '' : r[6]);
    slot.score = String(r[7] == null ? '' : r[7]);
    slot.notes = String(r[8] == null ? '' : r[8]);
    slot.examiner = String(r[9] == null ? '' : r[9]);
  });

  const completed = slots.filter(s => s.taken).length;
  const passed = slots.filter(s => s.result === 'LULUS').length;
  let latestPassed = 0;
  slots.forEach(s => { if (s.result === 'LULUS') latestPassed = Math.max(latestPassed, s.number); });
  return {max:PN_UKT_MAX, completed:completed, passed:passed, latestPassed:latestPassed, slots:slots};
}

function formatUktDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, 'Asia/Jakarta', 'yyyy-MM-dd');
  const s = String(value == null ? '' : value).trim();
  if (!s) return '';
  let m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/.exec(s);
  if (m) return m[3] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[1]).padStart(2,'0');
  m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  if (m) return m[1] + '-' + String(m[2]).padStart(2,'0') + '-' + String(m[3]).padStart(2,'0');
  return s;
}
'''.strip()


def must_replace(text, old, new, label, count=1):
    found = text.count(old)
    if found < count:
        raise RuntimeError(f'{label}: marker tidak ditemukan (butuh {count}, ada {found})')
    return text.replace(old, new, count)


def patch_html(text):
    if 'id="uktCard"' in text and 'function renderUkt' in text:
        return text
    text = must_replace(text, '\n@media(max-width:700px)', '\n' + UKT_CSS + '\n@media(max-width:700px)', 'CSS UKT')
    text = must_replace(text, '  </div></article>\n</section>', '  </div></article>\n' + UKT_ARTICLE + '\n</section>', 'kartu UKT')
    text = must_replace(text, '\nasync function loadBio', '\n' + UKT_JS + '\nasync function loadBio', 'JS UKT')
    text = must_replace(text, 'render(r.biodata);$(\'studentName\')', 'render(r.biodata);renderUkt(r.ukt);$(\'studentName\')', 'load UKT')
    text = must_replace(text, 'render(r.biodata);$(\'savedBox\')', 'render(r.biodata);renderUkt(r.ukt);$(\'savedBox\')', 'refresh UKT')
    text = text.replace('Portal Biodata aktif · versi 8.', 'Portal Biodata aktif · UKT 1–6 · versi 8.')
    return text


def patch_backend(text):
    if 'const PN_UKT_SHEET_NAME' in text and 'function getStudentUktHistory_' in text:
        return text
    text = must_replace(text,
        "const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';\n",
        "const PN_PORTAL_ACCOUNT_SHEET_NAME = 'Akun Portal Siswa';\nconst PN_UKT_SHEET_NAME = 'Riwayat UKT';\nconst PN_UKT_MAX = 6;\n",
        'konstanta UKT')
    text = must_replace(text,
        "    aspelRelations:true,\n    version:'7'",
        "    aspelRelations:true,\n    ukt:true,\n    uktMax:PN_UKT_MAX,\n    version:'8'",
        'versi API UKT')
    text = must_replace(text,
        "    aspel:getAspelSupervision_(auth.book, auth.memberId, [biodata.name, auth.username]),\n    account:{",
        "    aspel:getAspelSupervision_(auth.book, auth.memberId, [biodata.name, auth.username]),\n    ukt:getStudentUktHistory_(auth.book, auth.memberId),\n    account:{",
        'GET UKT')
    text = must_replace(text,
        "        aspel:getAspelSupervision_(auth.book, auth.memberId, [oldBio.name, auth.username])\n",
        "        aspel:getAspelSupervision_(auth.book, auth.memberId, [oldBio.name, auth.username]),\n        ukt:getStudentUktHistory_(auth.book, auth.memberId)\n",
        'UKT no-change')
    text = must_replace(text,
        "      aspel:getAspelSupervision_(auth.book, auth.memberId, [nextBio.name, auth.username])\n",
        "      aspel:getAspelSupervision_(auth.book, auth.memberId, [nextBio.name, auth.username]),\n      ukt:getStudentUktHistory_(auth.book, auth.memberId)\n",
        'UKT update')
    text = must_replace(text, '\nfunction biodataObject_(values) {', '\n' + UKT_BACKEND_HELPERS + '\n\nfunction biodataObject_(values) {', 'helper UKT')
    return text


html_before = HTML.read_text(encoding='utf-8')
backend_before = BACKEND.read_text(encoding='utf-8')
html_after = patch_html(html_before)
backend_after = patch_backend(backend_before)
HTML.write_text(html_after, encoding='utf-8')
BACKEND.write_text(backend_after, encoding='utf-8')

assert 'id="uktCard"' in html_after
assert 'BELUM MENGIKUTI' in html_after
assert 'renderUkt(r.ukt)' in html_after
assert "const PN_UKT_SHEET_NAME = 'Riwayat UKT';" in backend_after
assert 'ukt:getStudentUktHistory_(auth.book, auth.memberId)' in backend_after
assert "if (action === 'biodataUpdate')" in backend_after
print('Portal UKT tersinkron:', HTML, BACKEND)
