(()=>{
'use strict';

const MONTHS={
  januari:1,februari:2,maret:3,april:4,mei:5,juni:6,
  juli:7,agustus:8,september:9,oktober:10,november:11,desember:12,
  january:1,february:2,march:3,may:5,june:6,july:7,august:8,october:10,december:12
};

function validDate(y,m,d){
  const yy=Number(y),mm=Number(m),dd=Number(d);
  if(!yy||mm<1||mm>12||dd<1||dd>31)return false;
  const x=new Date(Date.UTC(yy,mm-1,dd));
  return x.getUTCFullYear()===yy&&x.getUTCMonth()===mm-1&&x.getUTCDate()===dd;
}

function pad(v){return String(v).padStart(2,'0')}

function normalizeDate(value){
  let s=String(value??'').trim();
  if(!s||s==='-'||s==='0')return '';

  let m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(m&&validDate(m[1],m[2],m[3]))return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;

  m=s.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
  if(m){
    let a=Number(m[1]),b=Number(m[2]),y=Number(m[3]);
    let d=a,mo=b;
    if(b>12&&a<=12){mo=a;d=b}
    if(validDate(y,mo,d))return `${y}-${pad(mo)}-${pad(d)}`;
  }

  m=s.match(/(?:^|[,\s])([0-3]?\d)\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})(?:\s|$)/i);
  if(m){
    const d=Number(m[1]);
    const monthKey=String(m[2]||'').toLowerCase();
    const mo=MONTHS[monthKey];
    const y=Number(m[3]);
    if(mo&&validDate(y,mo,d))return `${y}-${pad(mo)}-${pad(d)}`;
  }

  return '';
}

function setDate(id,value){
  const el=document.getElementById(id);
  if(!el)return;
  const normalized=normalizeDate(value);
  if(normalized)el.value=normalized;
}

function apply(data){
  if(!data)return;
  setDate('bio_birthDate',data.birthDate);
  setDate('bio_approvalDate',data.approvalDate);
  setDate('pnBio_birthDate',data.birthDate);
  setDate('pnBio_approvalDate',data.approvalDate);
}

function schedule(data){
  [0,40,120,300,700,1400].forEach(ms=>setTimeout(()=>apply(data),ms));
}

function esc(value){
  return String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function installAspelStyles(){
  if(document.getElementById('pnAspelPortalStyle'))return;
  const style=document.createElement('style');
  style.id='pnAspelPortalStyle';
  style.textContent=`
    .aspelSupervisionCard{margin-top:18px;background:#fff;border:1px solid #d9e7dd;border-radius:14px;box-shadow:0 8px 24px rgba(15,23,42,.07);overflow:hidden}
    .aspelSupervisionHead{padding:18px 20px;background:linear-gradient(135deg,#164e3a,#0f766e);color:#fff}
    .aspelSupervisionHead h2{margin:0;font-size:19px}.aspelSupervisionHead p{margin:6px 0 0;font-size:11px;line-height:1.55;opacity:.94}
    .aspelSupervisionBody{padding:18px 20px 20px}.aspelSummary{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding:11px 13px;border:1px solid #bbf7d0;border-radius:10px;background:#f0fdf4;color:#166534}
    .aspelSummary strong{font-size:12px}.aspelRoleList{display:flex;gap:6px;flex-wrap:wrap}.aspelRolePill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#166534;color:#fff;font-size:9px;font-weight:900}
    .aspelMemberList{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.aspelMemberCard{border:1px solid #dbe7df;border-radius:11px;padding:13px;background:#fbfefc}
    .aspelMemberTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.aspelMemberName{font-size:12px;font-weight:900;color:#14532d;line-height:1.35}.aspelMemberRole{flex:0 0 auto;padding:3px 7px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:8px;font-weight:900;text-align:center}
    .aspelMemberMeta{margin-top:5px;color:#64748b;font-size:9px;font-weight:700;line-height:1.45}.aspelTeam{margin-top:10px;padding-top:9px;border-top:1px solid #e5eee8;color:#334155;font-size:9px;line-height:1.55}.aspelTeam b{color:#14532d}
    @media(max-width:700px){.aspelMemberList{grid-template-columns:1fr}.aspelSupervisionHead{padding:16px}.aspelSupervisionBody{padding:14px}}
  `;
  document.head.appendChild(style);
}

function ensureAspelPanel(){
  let card=document.getElementById('aspelSupervisionCard');
  if(card)return card;
  const portal=document.getElementById('portalView');
  const bioCard=portal?.querySelector('.bioCard');
  if(!portal||!bioCard)return null;
  installAspelStyles();
  card=document.createElement('article');
  card.id='aspelSupervisionCard';
  card.className='aspelSupervisionCard hidden';
  card.innerHTML=`
    <div class="aspelSupervisionHead">
      <h2>KELOMPOK CALON ANGGOTA YANG SAYA DAMPINGI</h2>
      <p>Daftar ini terbentuk otomatis dari kolom Koordinator Aspel, Anggota Aspel 1, dan Anggota Aspel 2 pada database.</p>
    </div>
    <div class="aspelSupervisionBody">
      <div id="aspelSummary" class="aspelSummary"></div>
      <div id="aspelMemberList" class="aspelMemberList"></div>
    </div>`;
  bioCard.insertAdjacentElement('afterend',card);
  return card;
}

function renderAspel(info){
  const card=ensureAspelPanel();
  if(!card)return;
  const members=Array.isArray(info?.members)?info.members:[];
  if(!members.length){
    card.classList.add('hidden');
    return;
  }

  const summary=card.querySelector('#aspelSummary');
  const list=card.querySelector('#aspelMemberList');
  summary.innerHTML=`
    <strong>${members.length} calon anggota terhubung dengan tugas Aspel Anda</strong>
    <span class="aspelRoleList"><span class="aspelRolePill">${members.length} Calon Anggota</span></span>`;

  list.innerHTML=members.map((m,index)=>{
    const classProgram=[m.className,m.program].filter(Boolean).join(' · ');
    const meta=[m.memberId,classProgram,m.entryYear?`Masuk ${m.entryYear}`:''].filter(Boolean).join(' · ');
    const pendamping=[m.member1,m.member2].filter(Boolean).join(' / ')||'-';
    return `<div class="aspelMemberCard">
      <div class="aspelMemberTop">
        <div><div class="aspelMemberName">${esc(m.name)}</div><div class="aspelMemberMeta">${esc(meta)}</div></div>
        <span class="aspelMemberRole">Calon Anggota ${index+1}</span>
      </div>
      <div class="aspelTeam"><b>Koordinator:</b> ${esc(m.coordinator||'-')}<br><b>Anggota Aspel:</b> ${esc(pendamping)}</div>
    </div>`;
  }).join('');

  card.classList.remove('hidden');
}

window.addEventListener('message',event=>{
  const d=event.data;
  if(!d||d.source!=='pn-biodata'||!d.ok)return;
  if(d.biodata)schedule(d.biodata);
  renderAspel(d.aspel);
});

})();
