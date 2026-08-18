from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CODE = ROOT / 'backend' / 'Code.gs'
COMPACT = ROOT / 'js' / 'admin-compact-v1.js'
INDEX = ROOT / 'index.html'


def insert_before(text, anchor, block, marker):
    if marker in text:
        return text
    if anchor not in text:
        raise SystemExit(f'Anchor tidak ditemukan: {marker}')
    return text.replace(anchor, block + anchor, 1)


code = CODE.read_text(encoding='utf-8')
compact = COMPACT.read_text(encoding='utf-8')
index = INDEX.read_text(encoding='utf-8')

if "const PN_FIREBASE_PROJECT_ID = 'pagar-nusa-smk-sore';" not in code:
    anchor = "const PN_FIREBASE_API_KEY = 'AIzaSyCMWsvVJPem3_5Y-x8Zrjz90LodbNLkxUs';"
    if anchor not in code:
        raise SystemExit('Anchor Firebase API key tidak ditemukan')
    code = code.replace(anchor, anchor + "\nconst PN_FIREBASE_PROJECT_ID = 'pagar-nusa-smk-sore';", 1)

if "accountAdminPortal:true" not in code:
    anchor = "      aspelMonitorVersion:'1',"
    if anchor not in code:
        raise SystemExit('Anchor health tidak ditemukan')
    code = code.replace(anchor, anchor + "\n      accountAdminPortal:true,\n      accountAdminPortalVersion:'1',", 1)

get_block = """  if (action === 'portalAccountAdminList') {
    let result;
    try { result = portalAccountAdminList_(data); }
    catch (err) { result = {ok:false, accounts:[], summary:{total:0,anggota:0,calon:0,activeAccounts:0,missingAccounts:0}, message:String(err && err.message || err)}; }
    result.rid = String(data.rid || '');
    if (data.callback) return jsonp_(result, data.callback);
    return json_(result);
  }

"""
code = insert_before(code, "  if (action === 'adminNotificationCenter') {", get_block, "action === 'portalAccountAdminList'")

post_block = """    if (action === 'portalAccountAdminUpdate') {
      result = portalAccountAdminUpdate_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-account-admin');
    }

    if (action === 'portalAccountAdminResetPassword') {
      result = portalAccountAdminResetPassword_(data);
      result.rid = String(data.rid || '');
      return iframeResult_(result, 'pn-account-admin');
    }

"""
code = insert_before(code, "    if (action === 'contentAdminLogin') {", post_block, "action === 'portalAccountAdminResetPassword'")

catch_block = """    if (['portalAccountAdminUpdate','portalAccountAdminResetPassword'].includes(action)) {
      return iframeResult_(result, 'pn-account-admin');
    }
"""
catch_anchor = "    if (['contentAdminLogin','contentAdminSave','contentAdminDelete','contentAdminSeed','contentUploadImage','adminChangePassword','adminPasswordRecover','materiLogin','materiLogout','materiAdminSetAccess','materiAdminUpload','materiAdminDelete','pengurusLogin','pengurusLogout','pengurusAdminSave','pengurusAdminSetStatus','cbtScheduleAdminSave'].includes(action)) {"
if "['portalAccountAdminUpdate','portalAccountAdminResetPassword'].includes(action)" not in code:
    if catch_anchor not in code:
        raise SystemExit('Anchor catch tidak ditemukan')
    code = code.replace(catch_anchor, catch_block + catch_anchor, 1)

if 'admin-account-portal-v1.js' not in compact:
    compact += """

/* Load Portal Akun Anggota khusus area admin. */
(()=>{
  if(document.querySelector('script[data-pn-account-admin]'))return;
  const script=document.createElement('script');
  script.src='js/admin-account-portal-v1.js?v=1';
  script.async=false;
  script.dataset.pnAccountAdmin='1';
  document.head.appendChild(script);
})();
"""

if 'js/admin-compact-v1.js?v=5' not in index:
    if 'js/admin-compact-v1.js?v=4' not in index:
        raise SystemExit('Anchor cache admin-compact tidak ditemukan')
    index = index.replace('js/admin-compact-v1.js?v=4', 'js/admin-compact-v1.js?v=5', 1)

CODE.write_text(code, encoding='utf-8')
COMPACT.write_text(compact, encoding='utf-8')
INDEX.write_text(index, encoding='utf-8')
print('Portal Akun Anggota Admin V1 aktif pada source website.')
