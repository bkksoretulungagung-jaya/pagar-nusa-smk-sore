from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding='utf-8')


def write(path, text):
    Path(path).write_text(text, encoding='utf-8')


def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected 1 occurrence, found {count}')
    return text.replace(old, new, 1)


# 1) Clean duplicate script loads and bump cache versions.
path = 'index.html'
text = read(path)

# Collapse duplicated dashboard shortcut loaders to exactly one copy.
text, n = re.subn(r'(?m)^\s*<script src="js/dashboard-shortcuts-v1\.js\?v=\d+"></script>\s*\n?', '', text)
if n < 1:
    raise SystemExit('index: dashboard-shortcuts loader not found')
anchor = '<script src="js/reviews-public-refresh-v3.js?v=7"></script>'
if anchor not in text:
    raise SystemExit('index: reviews-public anchor not found')
text = text.replace(anchor, anchor + '\n<script src="js/dashboard-shortcuts-v1.js?v=9"></script>', 1)

# Collapse duplicated Drive image fixer to exactly one copy.
text, n = re.subn(r'(?m)^\s*<script src="js/drive-image-fix-v2\.js\?v=\d+"></script>\s*\n?', '', text)
if n < 1:
    raise SystemExit('index: drive-image-fix loader not found')
anchor = '<script src="js/cbt-toggle-v1.js?v=2"></script>'
if anchor not in text:
    raise SystemExit('index: cbt anchor not found')
text = text.replace(anchor, '<script src="js/cbt-toggle-v1.js?v=3"></script>\n<script src="js/drive-image-fix-v2.js?v=7"></script>', 1)

replacements = {
    '<script src="js/database-cloud-v1.js?v=7"></script>': '<script src="js/database-cloud-v1.js?v=8"></script>',
    '<script src="js/reviews-admin-session-v10.js?v=14"></script>': '<script src="js/reviews-admin-session-v10.js?v=15"></script>',
    '<script src="js/reviews-public-refresh-v3.js?v=7"></script>': '<script src="js/reviews-public-refresh-v3.js?v=8"></script>',
    '<script src="js/content-manager-v1.js?v=10"></script>': '<script src="js/content-manager-v1.js?v=11"></script>',
    '<script src="js/registration-toggle-v1.js?v=1"></script>': '<script src="js/registration-toggle-v1.js?v=2"></script>',
    '<script src="js/admin-notifications-v1.js?v=1"></script>': '<script src="js/admin-notifications-v1.js?v=2"></script>',
}
for old, new in replacements.items():
    text = replace_once(text, old, new, f'index replace {old}')
write(path, text)


# 2) Make the CMS the single source for content/admin-list reads.
path = 'js/content-manager-v1.js'
text = read(path)
text = replace_once(
    text,
    'async function postReliable(action,payload={},timeout=30000){',
    'async function postReliable(action,payload={},timeout=45000){',
    'content-manager post timeout'
)
old = "async function loadPublic(){\n  try{const r=await jsonp('contentPublicList',{},16000);if(!r||!r.ok)return;applyPublicNews(r.content||[]);applyPublicGallery(r.gallery||[])}catch(_){/* static content remains as fallback */}\n}"
new = "async function loadPublic(){\n  try{\n    const r=await jsonp('contentPublicList',{},18000);\n    if(!r||!r.ok)return;\n    window.__pnCmsPublicData=r;\n    window.__pnCmsPublicLoadedAt=Date.now();\n    window.dispatchEvent(new CustomEvent('pn:cms-public-data',{detail:r}));\n    applyPublicNews(r.content||[]);\n    applyPublicGallery(r.gallery||[]);\n  }catch(_){/* static content remains as fallback */}\n}"
text = replace_once(text, old, new, 'content-manager loadPublic')

needle = "    setStatus(`✓ Database konten online • ${adminContent.length} kabar/informasi • ${adminGallery.length} foto`,'ok');renderContentList();renderGalleryList();"
insert = "    window.__pnCmsAdminData=r;\n    window.__pnCmsAdminLoadedAt=Date.now();\n    window.dispatchEvent(new CustomEvent('pn:cms-admin-data',{detail:r}));\n" + needle
text = replace_once(text, needle, insert, 'content-manager admin cache')

old = "function boot(){loadPublic();installAdmin();setTimeout(installAdmin,500);setTimeout(installAdmin,1500);window.addEventListener('online',()=>{if(token())loadAdmin()})}"
new = "function boot(){\n  // Prioritaskan area admin saat sesi aktif; konten publik tetap punya fallback statis.\n  installAdmin();\n  if(token())setTimeout(loadPublic,3200);else loadPublic();\n  setTimeout(installAdmin,500);\n  setTimeout(installAdmin,1500);\n  window.addEventListener('online',()=>{if(token())loadAdmin();else loadPublic()});\n}"
text = replace_once(text, old, new, 'content-manager boot priority')
write(path, text)


# Shared helper installed into both feature-toggle modules.
def patch_toggle(path, kind):
    text = read(path)
    sleep_line = 'const sleep=ms=>new Promise(r=>setTimeout(r,ms));'
    helper = sleep_line + "\nasync function sharedCmsData(key,timeout=6500){\n  const started=Date.now();\n  while(Date.now()-started<timeout){\n    const value=window[key];\n    if(value&&value.ok)return value;\n    await sleep(140);\n  }\n  return null;\n}"
    text = replace_once(text, sleep_line, helper, f'{kind} shared helper')
    text = replace_once(
        text,
        "function token(){return sessionStorage.getItem(TOKEN_KEY)||''}",
        "function token(){try{return localStorage.getItem(TOKEN_KEY)||sessionStorage.getItem(TOKEN_KEY)||''}catch(_){return sessionStorage.getItem(TOKEN_KEY)||''}}",
        f'{kind} persistent token'
    )

    if kind == 'registration':
        old_pub = "async function loadPublicState(){\n  try{\n    const r=await jsonp('contentPublicList',{},15000);\n    if(r&&r.ok)applyState(stateFromItems(r.content));\n    else applyState('ON');\n  }catch(_){applyState('ON')}\n}"
        new_pub = "async function loadPublicState(){\n  const shared=await sharedCmsData('__pnCmsPublicData');\n  if(shared){applyState(stateFromItems(shared.content));return}\n  try{\n    const r=await jsonp('contentPublicList',{},15000);\n    if(r&&r.ok)applyState(stateFromItems(r.content));\n    else applyState('ON');\n  }catch(_){applyState('ON')}\n}"
        old_admin = "async function loadAdminState(){\n  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}\n  loadingAdmin=true;\n  try{\n    const r=await jsonp('contentAdminList',{token:t},16000);\n    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');\n    applyState(stateFromItems(r.content));\n  }catch(err){renderSwitchState(err.message||'Gagal membaca status pendaftaran.')}finally{loadingAdmin=false}\n}"
        new_admin = "async function loadAdminState(){\n  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}\n  loadingAdmin=true;\n  try{\n    const shared=await sharedCmsData('__pnCmsAdminData');\n    const r=shared||await jsonp('contentAdminList',{token:t},16000);\n    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');\n    applyState(stateFromItems(r.content));\n  }catch(err){renderSwitchState(err.message||'Gagal membaca status pendaftaran.')}finally{loadingAdmin=false}\n}"
        events = "window.addEventListener('pn:cms-public-data',e=>{if(e.detail?.ok)applyState(stateFromItems(e.detail.content))});\nwindow.addEventListener('pn:cms-admin-data',e=>{if(e.detail?.ok&&token())applyState(stateFromItems(e.detail.content))});\n"
    else:
        old_pub = "async function loadPublicState(){\n  try{\n    const r=await jsonp('contentPublicList',{},15000);\n    if(r&&r.ok)applyState(stateFromItems(r.content));\n    else applyState('ON');\n  }catch(_){applyState('ON')}\n}"
        new_pub = "async function loadPublicState(){\n  const shared=await sharedCmsData('__pnCmsPublicData');\n  if(shared){applyState(stateFromItems(shared.content));return}\n  try{\n    const r=await jsonp('contentPublicList',{},15000);\n    if(r&&r.ok)applyState(stateFromItems(r.content));\n    else applyState('ON');\n  }catch(_){applyState('ON')}\n}"
        old_admin = "async function loadAdminState(){\n  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}\n  loadingAdmin=true;\n  try{\n    const r=await jsonp('contentAdminList',{token:t},16000);\n    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');\n    applyState(stateFromItems(r.content));\n  }catch(err){renderSwitchState(err.message||'Gagal membaca status Portal CBT.')}finally{loadingAdmin=false}\n}"
        new_admin = "async function loadAdminState(){\n  if(loadingAdmin)return;const t=token();if(!t){renderSwitchState();return}\n  loadingAdmin=true;\n  try{\n    const shared=await sharedCmsData('__pnCmsAdminData');\n    const r=shared||await jsonp('contentAdminList',{token:t},16000);\n    if(!r?.ok)throw new Error(r?.message||'Sesi admin tidak valid.');\n    applyState(stateFromItems(r.content));\n  }catch(err){renderSwitchState(err.message||'Gagal membaca status Portal CBT.')}finally{loadingAdmin=false}\n}"
        events = "window.addEventListener('pn:cms-public-data',e=>{if(e.detail?.ok)applyState(stateFromItems(e.detail.content))});\nwindow.addEventListener('pn:cms-admin-data',e=>{if(e.detail?.ok&&token())applyState(stateFromItems(e.detail.content))});\n"

    text = replace_once(text, old_pub, new_pub, f'{kind} public cache')
    text = replace_once(text, old_admin, new_admin, f'{kind} admin cache')
    marker = "document.addEventListener('click',e=>{const id=e.target?.id;if(id==='pnCmsConnect'||id==='pnCmsReload')setTimeout(()=>{watchAdmin();loadAdminState()},1300)});"
    text = replace_once(text, marker, events + marker, f'{kind} shared events')
    write(path, text)


patch_toggle('js/registration-toggle-v1.js', 'registration')
patch_toggle('js/cbt-toggle-v1.js', 'cbt')


# 4) Reduce Excel-cloud pressure during the critical first seconds.
path = 'js/database-cloud-v1.js'
text = read(path)
text = replace_once(text, 'const PN_DB_DOWNLOAD_CONCURRENCY=3;', 'const PN_DB_DOWNLOAD_CONCURRENCY=2;', 'database concurrency')
text = replace_once(text, 'setTimeout(pnMaybeLoadCloud,700);', 'setTimeout(pnMaybeLoadCloud,4000);', 'database initial delay')
text = replace_once(text, 'setInterval(pnMaybeLoadCloud,2500);', 'setInterval(pnMaybeLoadCloud,15000);', 'database retry interval')
write(path, text)


# 5) Defer non-critical review/notification reads so CMS gets the first server slot.
path = 'js/reviews-public-refresh-v3.js'
text = read(path)
text = replace_once(text, '  setTimeout(refresh,120);', '  setTimeout(refresh,4800);', 'review public initial delay')
text = replace_once(text, '  setTimeout(()=>{if(!loading)refresh()},2500);', '  setTimeout(()=>{if(!loading)refresh()},9500);', 'review public second delay')
write(path, text)

path = 'js/reviews-admin-session-v10.js'
text = read(path)
old = "  },300);\n}\n\ndocument.addEventListener('DOMContentLoaded',boot);"
new = "  },2800);\n}\n\ndocument.addEventListener('DOMContentLoaded',boot);"
text = replace_once(text, old, new, 'review admin initial delay')
write(path, text)

path = 'js/admin-notifications-v1.js'
text = read(path)
text = replace_once(
    text,
    "document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,400));",
    "document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,6000));",
    'notifications initial delay'
)
text = replace_once(
    text,
    "setInterval(()=>{const root=ensureRoot();if(root){root.classList.toggle('hidden',!isAdmin());if(isAdmin()&&!lastData)load(false)}},1500);",
    "setInterval(()=>{const root=ensureRoot();if(root){root.classList.toggle('hidden',!isAdmin());if(isAdmin()&&!lastData)load(false)}},5000);",
    'notifications guard interval'
)
write(path, text)

print('Startup optimization V1 applied successfully.')
