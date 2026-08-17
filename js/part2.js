function excelToISO(v){const s=trim(v);if(!s)return '';const n=Number(s);if(Number.isFinite(n)&&n>1000){const d=new Date(Date.UTC(1899,11,30)+Math.round(n)*86400000);return d.toISOString().slice(0,10)}const months={januari:1,februari:2,maret:3,april:4,mei:5,juni:6,juli:7,agustus:8,september:9,oktober:10,november:11,desember:12};const m=s.toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/);if(m&&months[m[2]])return `${m[3]}-${String(months[m[2]]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;return ''}
function isoToExcel(v){if(!v)return '';const d=new Date(v+'T00:00:00Z');return Math.round((d-Date.UTC(1899,11,30))/86400000)}
function displayCell(sheet,addr,type='text'){const v=cellText(docs[sheet],cellMaps[sheet],addr);if(type==='date'){const iso=excelToISO(v);return iso||v}return v}

function u16(d,o){return d.getUint16(o,true)} function u32(d,o){return d.getUint32(o,true)}
async function inflateRaw(data){if(!('DecompressionStream'in window))throw new Error('Database terkompresi. Gunakan Database_Pagar_Nusa_BROWSER.xlsm dari paket aplikasi.');const ds=new DecompressionStream('deflate-raw'),stream=new Blob([data]).stream().pipeThrough(ds);return new Uint8Array(await new Response(stream).arrayBuffer())}
async function readZip(arrayBuffer){
  const bytes=new Uint8Array(arrayBuffer),dv=new DataView(arrayBuffer);
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-66000);i--){if(u32(dv,i)===0x06054b50){eocd=i;break}}
  if(eocd<0)throw new Error('File bukan XLSM/XLSX yang valid.');
  const total=u16(dv,eocd+10),cdOff=u32(dv,eocd+16);
  let p=cdOff;
  const metas=[];
  for(let k=0;k<total;k++){
    if(u32(dv,p)!==0x02014b50)throw new Error('Central directory ZIP rusak.');
    const method=u16(dv,p+10),crc=u32(dv,p+16),cs=u32(dv,p+20),us=u32(dv,p+24),nl=u16(dv,p+28),el=u16(dv,p+30),cl=u16(dv,p+32),lo=u32(dv,p+42);
    const name=new TextDecoder().decode(bytes.slice(p+46,p+46+nl));
    if(u32(dv,lo)!==0x04034b50)throw new Error('Local header ZIP rusak.');
    const lnl=u16(dv,lo+26),lel=u16(dv,lo+28),ds=lo+30+lnl+lel;
    const raw=new Uint8Array(bytes.slice(ds,ds+cs));
    metas.push({name,raw,method,us,crc});
    p+=46+nl+el+cl;
  }

  const entries=new Array(metas.length);
  let next=0;
  async function worker(){
    while(true){
      const i=next++;
      if(i>=metas.length)return;
      const e=metas[i];
      let data;
      if(e.method===0)data=e.raw;
      else if(e.method===8)data=await inflateRaw(e.raw);
      else throw new Error('Metode kompresi ZIP tidak didukung: '+e.method);
      if(e.us&&data.length!==e.us)console.warn('Ukuran entry berbeda',e.name,data.length,e.us);
      entries[i]={name:e.name,data,crc:e.crc};
      if((i&7)===0)await new Promise(resolve=>setTimeout(resolve,0));
    }
  }
  const cpu=Math.max(2,Math.min(4,Number(navigator.hardwareConcurrency||4)));
  await Promise.all(Array.from({length:Math.min(cpu,metas.length)},()=>worker()));
  return entries;
}
let crcTable=null;function crc32(bytes){if(!crcTable){crcTable=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);crcTable[n]=c>>>0}}let c=0xffffffff;for(const b of bytes)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0}
function w16(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255}function w32(a,o,v){a[o]=v&255;a[o+1]=(v>>>8)&255;a[o+2]=(v>>>16)&255;a[o+3]=(v>>>24)&255}
function concat(parts,total){const out=new Uint8Array(total);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}
function dosNow(){const d=new Date(),time=((d.getHours()&31)<<11)|((d.getMinutes()&63)<<5)|((Math.floor(d.getSeconds()/2))&31),date=(((d.getFullYear()-1980)&127)<<9)|(((d.getMonth()+1)&15)<<5)|(d.getDate()&31);return{time,date}}
function buildZip(entries){let locals=[],centrals=[],offset=0,locTotal=0,cenTotal=0;const dt=dosNow();for(const e of entries){const name=textToBytes(e.name),data=e.data,crc=crc32(data),lh=new Uint8Array(30+name.length);w32(lh,0,0x04034b50);w16(lh,4,20);w16(lh,6,0x0800);w16(lh,8,0);w16(lh,10,dt.time);w16(lh,12,dt.date);w32(lh,14,crc);w32(lh,18,data.length);w32(lh,22,data.length);w16(lh,26,name.length);w16(lh,28,0);lh.set(name,30);locals.push(lh,data);locTotal+=lh.length+data.length;const ch=new Uint8Array(46+name.length);w32(ch,0,0x02014b50);w16(ch,4,20);w16(ch,6,20);w16(ch,8,0x0800);w16(ch,10,0);w16(ch,12,dt.time);w16(ch,14,dt.date);w32(ch,16,crc);w32(ch,20,data.length);w32(ch,24,data.length);w16(ch,28,name.length);w16(ch,30,0);w16(ch,32,0);w16(ch,34,0);w16(ch,36,0);w32(ch,38,0);w32(ch,42,offset);ch.set(name,46);centrals.push(ch);cenTotal+=ch.length;offset+=lh.length+data.length}const eocd=new Uint8Array(22);w32(eocd,0,0x06054b50);w16(eocd,4,0);w16(eocd,6,0);w16(eocd,8,entries.length);w16(eocd,10,entries.length);w32(eocd,12,cenTotal);w32(eocd,16,locTotal);w16(eocd,20,0);return concat([...locals,...centrals,eocd],locTotal+cenTotal+22)}
function normalizeRelTarget(t){t=t.replace(/^\//,'');return t.startsWith('xl/')?t:'xl/'+t.replace(/^\.\//,'')}

const REF={gender:'A',kelas:'B',program:'C',belt:'D',memberStatus:'E',studentStatus:'F',paymentType:'I',position:'J',pengurusStatus:'K',alumniActivity:'L',alumniContact:'M',violationType:'N',violationLevel:'O',violationStatus:'P',paymentMethod:'Q',paymentStatus:'R',sp:'S',exitCategory:'T',exitReason:'U',followup:'V'};
