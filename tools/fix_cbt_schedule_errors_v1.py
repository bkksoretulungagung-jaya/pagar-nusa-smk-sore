from pathlib import Path
p=Path('backend/Code.gs')
s=p.read_text(encoding='utf-8')

marker="""    if (action === 'biodataGet' || action === 'biodataUpdate') {
      return iframeResult_(result, 'pn-biodata');
    }
"""
addition=marker+"""    if (action === 'cbtAccessCheck') {
      return iframeResult_(result, 'pn-cbt');
    }
"""
if "return iframeResult_(result, 'pn-cbt');\n    }\n    if (['reviewSubmit'" not in s:
    if marker not in s: raise SystemExit('marker catch biodata tidak ditemukan')
    s=s.replace(marker,addition,1)

old="'pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus'].includes(action)"
new="'pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus','cbtScheduleAdminSave'].includes(action)"
if new not in s:
    if old not in s: raise SystemExit('marker daftar pn-content tidak ditemukan')
    s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('CBT schedule error routing fixed')
