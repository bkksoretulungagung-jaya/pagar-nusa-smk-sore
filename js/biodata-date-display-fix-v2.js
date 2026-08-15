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
    // Data teks lama mayoritas DD/MM/YYYY. Jika angka kedua > 12, pasti MM/DD/YYYY.
    if(b>12&&a<=12){mo=a;d=b}
    if(validDate(y,mo,d))return `${y}-${pad(mo)}-${pad(d)}`;
  }

  // Tanggal pengesahan lama sering berbentuk: "Tulungagung, 10 Mei 2025".
  // Ambil bagian tanggalnya saja tanpa mengubah isi database asli.
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

window.addEventListener('message',event=>{
  const d=event.data;
  if(!d||d.source!=='pn-biodata'||!d.ok||!d.biodata)return;
  schedule(d.biodata);
});

})();
