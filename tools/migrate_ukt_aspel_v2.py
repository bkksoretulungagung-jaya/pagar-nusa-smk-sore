from pathlib import Path
import re

BACKEND = Path('backend/Biodata.gs')
PORTAL = Path('biodata.html')


def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Pola tidak ditemukan: {label}')
    return text.replace(old, new)


# --- Backend Apps Script ---
backend = BACKEND.read_text(encoding='utf-8')
backend = must_replace(
    backend,
    "const PN_UKT_MAX = 6;",
    "const PN_UKT_STAGES = ['UKT 1','UKT 2','UKT 3','UKT 4','UKT 5','ASPEL'];\nconst PN_UKT_MAX = PN_UKT_STAGES.length;",
    'konstanta PN_UKT_MAX',
)
backend = backend.replace("version:'8'", "version:'9'", 1)

new_ukt_backend = r'''function emptyUktSlot_(number) {
  const label = PN_UKT_STAGES[number - 1] || ('UKT ' + number);
  return {
    number:number,
    ukt:label,
    label:label,
    taken:false,
    date:'',
    before:'',
    result:'',
    after:'',
    score:'',
    notes:'',
    examiner:''
  };
}

function getStudentUktHistory_(book, memberId) {
  const slots = Array.from({length:PN_UKT_MAX}, (_,i) => emptyUktSlot_(i+1));
  const sheet = book.getSheetByName(PN_UKT_SHEET_NAME);

  if (!sheet || sheet.getLastRow() < 2) {
    return {
      max:PN_UKT_MAX,
      stages:PN_UKT_STAGES.slice(),
      completed:0,
      passed:0,
      latestPassed:0,
      slots:slots
    };
  }

  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,10).getValues();
  const target = String(memberId || '').trim().toLowerCase();

  rows.forEach(r => {
    if (String(r[0] || '').trim().toLowerCase() !== target) return;

    const stageText = String(r[2] == null ? '' : r[2]).trim().toUpperCase();
    let number = 0;

    // Tahap keenam sekarang ASPEL. Format lama UKT-6 tetap dibaca sebagai
    // ASPEL agar data lama tidak hilang saat masa migrasi database.
    if (
      stageText === 'ASPEL' ||
      stageText === 'ASISTEN PELATIH' ||
      /^UKT[\s-]*6$/.test(stageText)
    ) {
      number = 6;
    } else {
      const match = stageText.match(/^(?:UKT[\s-]*)?([1-5])$/);
      number = match ? Number(match[1]) : 0;
    }

    if (!number || number < 1 || number > PN_UKT_MAX) return;

    const slot = slots[number - 1];
    slot.ukt = PN_UKT_STAGES[number - 1];
    slot.label = slot.ukt;
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
  slots.forEach(s => {
    if (s.result === 'LULUS') latestPassed = Math.max(latestPassed, s.number);
  });

  return {
    max:PN_UKT_MAX,
    stages:PN_UKT_STAGES.slice(),
    completed:completed,
    passed:passed,
    latestPassed:latestPassed,
    slots:slots
  };
}

'''

backend_pattern = re.compile(
    r"function emptyUktSlot_\(number\) \{.*?\n\}\n\nfunction getStudentUktHistory_\(book, memberId\) \{.*?\n\}\n\n(?=function formatUktDate_)",
    re.S,
)
backend, count = backend_pattern.subn(lambda _m: new_ukt_backend, backend, count=1)
if count != 1:
    raise SystemExit('Blok fungsi UKT backend tidak berhasil diganti.')

if "'ASPEL'" not in backend or "PN_UKT_STAGES" not in backend:
    raise SystemExit('Validasi backend ASPEL gagal.')
BACKEND.write_text(backend, encoding='utf-8')


# --- Portal Biodata ---
portal = PORTAL.read_text(encoding='utf-8')
portal = portal.replace('UKT 1 sampai UKT 6', 'UKT 1 sampai UKT 5 dan ASPEL (Asisten Pelatih)')
portal = portal.replace('UKT 1–6', 'UKT 1–5 + ASPEL')
portal = portal.replace('UKT 1-6', 'UKT 1-5 + ASPEL')
portal = portal.replace('0 / 6 LULUS', '0 / 6 TAHAP LULUS')
portal = portal.replace('versi 8', 'versi 9')
portal = portal.replace('version 8', 'version 9')
portal = portal.replace('bila ada ujian ulang pada UKT yang sama', 'bila ada ujian ulang pada tahap yang sama')

new_slots = """function pnUktSlots(){const stages=['UKT 1','UKT 2','UKT 3','UKT 4','UKT 5','ASPEL'];return stages.map((label,i)=>({number:i+1,ukt:label,label:label,taken:false,date:'',before:'',result:'',after:'',score:'',notes:'',examiner:''}))}\n"""
slots_pattern = re.compile(r"function pnUktSlots\(\)\{.*?\}\n", re.S)
portal, count = slots_pattern.subn(lambda _m: new_slots, portal, count=1)
if count != 1:
    raise SystemExit('pnUktSlots tidak ditemukan pada portal.')

new_render = r'''function renderUkt(data){
  const summary=$('uktSummary'),grid=$('uktGrid');
  if(!summary||!grid)return;
  const fallbackSlots=pnUktSlots();
  const slots=Array.isArray(data?.slots)&&data.slots.length?data.slots:fallbackSlots;
  const completed=Number(data?.completed??slots.filter(x=>x.taken).length);
  const passed=Number(data?.passed??slots.filter(x=>String(x.result||'').toUpperCase()==='LULUS').length);
  summary.innerHTML=`<span>${completed?`${completed} tahap UKT/ASPEL sudah memiliki catatan hasil`:'Belum ada hasil UKT/ASPEL yang tercatat untuk ID Anggota ini'}</span><span class="uktProgress">${passed} / 6 TAHAP LULUS</span>`;
  grid.innerHTML=fallbackSlots.map((fallback,i)=>{
    const x=slots[i]||fallback;
    const n=Number(x.number||i+1);
    const stage=String(x.ukt||x.label||fallback.ukt||(n===6?'ASPEL':`UKT ${n}`));
    const result=String(x.result||'').trim().toUpperCase();
    const taken=!!x.taken||!!result||!!x.date;
    if(!taken){
      return `<div class="uktItem pending"><div class="uktTop"><h3 class="uktTitle">${pnUktEsc(stage)}</h3><span class="uktBadge pending">BELUM MENGIKUTI</span></div><div class="uktEmpty"><div><strong>Belum ada hasil ${pnUktEsc(stage)}</strong>Data akan muncul otomatis setelah admin mengisi sheet Riwayat UKT.</div></div></div>`;
    }
    const cls=result==='LULUS'?'pass':(result==='TIDAK LULUS'?'fail':'pending');
    return `<div class="uktItem"><div class="uktTop"><div><h3 class="uktTitle">${pnUktEsc(stage)}</h3><div class="uktDate">${pnUktEsc(pnUktDate(x.date))}</div></div><span class="uktBadge ${cls}">${pnUktEsc(result||'TERCATAT')}</span></div><div class="uktDetails"><div class="uktDetail"><b>Tingkat Sebelum</b>${pnUktEsc(x.before||'-')}</div><div class="uktDetail"><b>Tingkat/Sabuk Setelah</b>${pnUktEsc(x.after||'-')}</div><div class="uktDetail"><b>Nilai</b>${pnUktEsc(x.score||'-')}</div><div class="uktDetail"><b>Penguji</b>${pnUktEsc(x.examiner||'-')}</div><div class="uktDetail full"><b>Keterangan</b>${pnUktEsc(x.notes||'-')}</div></div></div>`;
  }).join('');
}
'''
render_pattern = re.compile(
    r"function renderUkt\(data\)\{.*?\}(?=\nasync function loadBio)",
    re.S,
)
portal, count = render_pattern.subn(lambda _m: new_render.rstrip(), portal, count=1)
if count != 1:
    raise SystemExit('renderUkt tidak ditemukan pada portal.')

portal = portal.replace('Portal Biodata aktif · UKT 1–5 + ASPEL · versi 8.', 'Portal Biodata aktif · UKT 1–5 + ASPEL · versi 9.')

if 'ASPEL' not in portal:
    raise SystemExit('Validasi portal ASPEL gagal.')
if 'UKT 1 sampai UKT 6' in portal or 'UKT 1–6' in portal:
    raise SystemExit('Masih ada nomenklatur UKT 1-6 pada portal.')
PORTAL.write_text(portal, encoding='utf-8')

# Hapus utilitas sinkronisasi versi lama agar tidak mengembalikan UKT 6 di masa depan.
for stale in [
    Path('tools/sync_ukt_portal_v1.py'),
    Path('.github/workflows/sync-ukt-portal-v1.yml'),
]:
    if stale.exists():
        stale.unlink()

print('Migrasi selesai: UKT 1-5 + ASPEL, backend dan portal versi 9.')
