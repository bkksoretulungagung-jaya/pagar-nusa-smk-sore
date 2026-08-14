async function saveAttendance(overwrite=false){if(!selectedPerson){alert('Pilih anggota terlebih dahulu.');return}const x=attendanceValues();if(!x)return;const r=ensureAttendancePerson(true),mo=attendanceMonths[parseInt($('attMonth').value||'0',10)];if(!mo)return;const current=[0,1,2,3,4].map(i=>trim(cellText(docs['Kehadiran'],cellMaps['Kehadiran'],ref(mo.start+i,r))));if(!overwrite&&current.some(v=>v!=='')){alert('Data bulan ini sudah ada. Gunakan UBAH untuk mengganti.');return}for(let i=0;i<4;i++)writeOrCache('Kehadiran',ref(mo.start+i,r),x.vals[i],true,ref(mo.start+i,4));writeOrCache('Kehadiran',ref(mo.start+4,r),x.doVal,false,ref(mo.start+4,4));const total=x.vals.reduce((a,b)=>a+b,0),pct=total?x.vals[0]/total:0;writeOrCache('Kehadiran',ref(mo.start+5,r),pct,true,ref(mo.start+5,4));await afterMutation(`${overwrite?'UBAH':'SIMPAN'} kehadiran ${selectedPerson.name} — ${mo.name}`);loadAttendanceCurrent();renderRecords(false)}
async function deleteAttendance(){if(!selectedPerson){alert('Pilih anggota terlebih dahulu.');return}const r=attendanceRowForPerson(),mo=attendanceMonths[parseInt($('attMonth').value||'0',10)];if(!r||!mo){alert('Data tidak ditemukan.');return}if(!confirm(`Hapus kehadiran ${selectedPerson.name} — ${mo.name}?`))return;for(let i=0;i<5;i++)clearCell('Kehadiran',ref(mo.start+i,r),true);writeOrCache('Kehadiran',ref(mo.start+5,r),0,true,ref(mo.start+5,4));await afterMutation(`HAPUS kehadiran ${selectedPerson.name} — ${mo.name}`);loadAttendanceCurrent();renderRecords(false)}

async function saveRecord(){if(!zipEntries){alert('Pilih database terlebih dahulu.');return}const m=currentModule();if(m.special==='attendance'){await saveAttendance(false);return}if(m.link&&!selectedPerson){alert('Pilih anggota/pengurus terlebih dahulu.');return}if(!validateForm())return;const row=firstBlankRow(m);if(!row){alert('Slot data pada sheet '+m.sheet+' sudah penuh.');return}writeFields(m,row);if(m.link)coreLinkedWrite(m,row);refreshDerived(m,row);selectedRow=row;$('rowBadge').textContent='BARIS '+row;$('rowBadge').className='badge ok';await afterMutation(`SIMPAN berhasil — ${m.title}`);renderRecords(false);if(activeModule==='siswa'||activeModule==='pengurus'){loadCaches();loadPengurusPeople();refreshDashboard()}if(activeModule==='alumni'||activeModule==='prestasi'||activeModule==='keluar')refreshDashboard()}
async function updateRecord(){if(!zipEntries){alert('Pilih database terlebih dahulu.');return}const m=currentModule();if(m.special==='attendance'){await saveAttendance(true);return}if(!selectedRow){alert('Pilih data pada tabel HASIL terlebih dahulu, lalu klik UBAH.');return}if(m.link&&!selectedPerson){const id=trim(cellText(docs[m.sheet],cellMaps[m.sheet],m.primary+selectedRow));selectedPerson=findPersonById(id)}if(m.link&&!selectedPerson){alert('Data anggota terkait tidak ditemukan.');return}if(!validateForm())return;if(!confirm('Simpan perubahan pada baris '+selectedRow+'?'))return;writeFields(m,selectedRow);if(m.link)coreLinkedWrite(m,selectedRow);refreshDerived(m,selectedRow);await afterMutation(`UBAH berhasil — ${m.title}`);renderRecords(false);if(activeModule==='siswa'||activeModule==='pengurus'){loadCaches();loadPengurusPeople();refreshDashboard()}if(activeModule==='alumni'||activeModule==='prestasi'||activeModule==='keluar')refreshDashboard()}
async function deleteRecord(){if(!zipEntries){alert('Pilih database terlebih dahulu.');return}const m=currentModule();if(m.special==='attendance'){await deleteAttendance();return}if(!selectedRow){alert('Pilih data yang akan dihapus pada tabel HASIL.');return}if(!confirm('Hapus data pada baris '+selectedRow+' dari '+m.title+'?'))return;clearRowFields(m,selectedRow);if(m.link){if(activeModule==='alumni'){['B','C','D','E','F','H'].forEach(c=>clearCell(m.sheet,c+selectedRow,true))}else if(['kenaikan','prestasi','iuran','pelanggaran'].includes(activeModule)){['C','D'].forEach(c=>clearCell(m.sheet,c+selectedRow,true))}else if(activeModule==='sp'){['C','D','E','F','L','M'].forEach(c=>clearCell(m.sheet,c+selectedRow,true))}else if(activeModule==='keluar'){['D','E','F'].forEach(c=>clearCell(m.sheet,c+selectedRow,true))}}selectedRow=0;$('rowBadge').textContent='DATA BARU';$('rowBadge').className='badge';clearFormFields();await afterMutation(`HAPUS berhasil — ${m.title}`);renderRecords(false);if(activeModule==='siswa'||activeModule==='pengurus'){loadCaches();loadPengurusPeople();refreshDashboard()}if(activeModule==='alumni'||activeModule==='prestasi'||activeModule==='keluar')refreshDashboard()}

function loadRecord(row){const m=currentModule();selectedRow=row;$('rowBadge').textContent='BARIS '+row;$('rowBadge').className='badge ok';for(const f of m.fields||[])setFieldValue(f,cellText(docs[m.sheet],cellMaps[m.sheet],f.c+row));if(m.link){const id=trim(cellText(docs[m.sheet],cellMaps[m.sheet],m.primary+row));selectedPerson=findPersonById(id);if(selectedPerson){$('personSearch').value=selectedPerson.name;peopleResults=[selectedPerson];const sel=$('personResults');sel.innerHTML='';const o=document.createElement('option');o.value='0';o.textContent=`${selectedPerson.id} | ${selectedPerson.name} | ${selectedPerson.source}`;sel.appendChild(o);sel.selectedIndex=0;selectPerson()}}renderRecords(false);window.scrollTo({top:0,behavior:'smooth'})}
function recordRowText(m,row){return (m.recordCols||[]).map(c=>trim(cellText(docs[m.sheet],cellMaps[m.sheet],c+row))).join(' ').toLowerCase()}
function recordExists(m,row){return trim(cellText(docs[m.sheet],cellMaps[m.sheet],m.primary+row))!==''}
function renderRecords(scroll){
  const head=$('resultHead'),body=$('resultBody'),count=$('recordCount');
  head.innerHTML='';body.innerHTML='';
  if(!zipEntries){
    count.textContent='0 data';
    body.innerHTML='<tr><td style="padding:18px;color:#64748b;text-align:center">Database belum dipilih. Buka menu ⚙ DATABASE terlebih dahulu.</td></tr>';
    return 0;
  }
  const m=currentModule(),q=trim($('recordSearch').value).toLowerCase();
  let cols=m.recordCols||[],labels=m.recordLabels||cols;
  if(m.special==='attendance'){cols=m.recordCols;labels=m.recordLabels}
  head.innerHTML='<tr>'+labels.map(x=>'<th>'+esc(x)+'</th>').join('')+'</tr>';
  let rows=[];
  for(let r=m.start;r<=m.end;r++){
    if(!recordExists(m,r))continue;
    if(m.link&&selectedPerson){
      const id=trim(cellText(docs[m.sheet],cellMaps[m.sheet],m.primary+r));
      if(activeModule==='kehadiran'){
        const nm=trim(cellText(docs[m.sheet],cellMaps[m.sheet],'C'+r));
        if(id!==selectedPerson.id&&nm.toLowerCase()!==selectedPerson.name.toLowerCase())continue;
      }else if(id!==selectedPerson.id)continue;
    }
    if(q&&!recordRowText(m,r).includes(q))continue;
    rows.push(r);if(rows.length>=300)break;
  }
  count.textContent=rows.length+' data';
  if(!rows.length){
    const colSpan=Math.max(labels.length,1);
    const filterInfo=selectedPerson?' untuk '+esc(selectedPerson.name):'';
    body.innerHTML='<tr><td colspan="'+colSpan+'" style="padding:20px;text-align:center;color:#64748b">Belum ada data '+esc(m.title)+filterInfo+' yang sesuai.</td></tr>';
  }else{
    for(const r of rows){
      const tr=document.createElement('tr');tr.dataset.row=r;if(r===selectedRow)tr.className='selected';
      tr.innerHTML=cols.map(c=>{let v=cellText(docs[m.sheet],cellMaps[m.sheet],c+r);if((c==='B'||c==='K'||c==='P')&&['kenaikan','prestasi','iuran','pelanggaran','sp','keluar'].includes(activeModule)){const iso=excelToISO(v);if(iso)v=iso}return'<td>'+esc(v)+'</td>'}).join('');
      if(!m.special)tr.onclick=()=>loadRecord(r);body.appendChild(tr);
    }
  }
  if(scroll){const target=$('dataResultsCard');if(target)target.scrollIntoView({behavior:'smooth',block:'start'})}
  return rows.length;
}

function lihatData(){
  if(!zipEntries){
    alert('Database belum dipilih. Klik ⚙ DATABASE lalu pilih file database Excel terlebih dahulu.');
    toggleDatabasePanel(true);
    return;
  }
  const total=renderRecords(false);
  const target=$('dataResultsCard');
  if(target){
    target.classList.add('flashResult');
    target.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>target.classList.remove('flashResult'),1200);
  }
  const m=currentModule();
  setStatus('<b>LIHAT DATA — '+esc(m.title)+'</b>: '+total+' data ditampilkan pada bagian DATA / HASIL.','ok');
}

function serializeDirty(){for(const s of dirtySheets){const p=sheetPaths[s];if(p&&entryMap.has(p))entryMap.get(p).data=textToBytes(new XMLSerializer().serializeToString(docs[s]))}const wbDoc=docs._workbook;let cp=firstLocal(wbDoc,'calcPr');if(!cp){cp=wbDoc.createElementNS(NS,'calcPr');wbDoc.documentElement.appendChild(cp)}cp.setAttribute('calcMode','auto');cp.setAttribute('fullCalcOnLoad','1');cp.setAttribute('forceFullCalc','1');entryMap.get('xl/workbook.xml').data=textToBytes(new XMLSerializer().serializeToString(wbDoc))}
function buildCurrentWorkbook(){serializeDirty();return buildZip(zipEntries)}
