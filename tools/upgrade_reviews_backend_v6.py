from pathlib import Path

p = Path('backend/Code.gs')
text = p.read_text(encoding='utf-8')

text = text.replace("reviewVersion:'5'", "reviewVersion:'6'")
text = text.replace("version:'5'", "version:'6'")

get_marker = """  if (action === 'register') {
"""
admin_get_block = """  if (action === 'reviewAdminList') {
    let result;
    try {
      result = reviewAdminList_(data);
    } catch (err) {
      result = {ok:false, reviews:[], message:String(err && err.message || err)};
    }
    result.rid = String(data.rid || '');
    if (data.callback) {
      return jsonp_(result, data.callback);
    }
    return json_(result);
  }

"""
if admin_get_block not in text:
    if get_marker not in text:
        raise SystemExit('doGet register marker not found')
    text = text.replace(get_marker, admin_get_block + get_marker, 1)

old_login = """function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  if (username !== PN_REVIEW_ADMIN_USER || sha256Hex_(password) !== PN_REVIEW_ADMIN_PASS_HASH) {
    throw new Error('Login admin verifikasi tidak valid.');
  }
  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('pn-review-admin:' + token, username, 21600);
  return {ok:true,token:token,expiresIn:21600};
}
"""

new_login = """function reviewAdminLogin_(data) {
  const username = String(data.username || '').trim();
  const password = String(data.password || '');
  if (username !== PN_REVIEW_ADMIN_USER || sha256Hex_(password) !== PN_REVIEW_ADMIN_PASS_HASH) {
    throw new Error('Login admin verifikasi tidak valid.');
  }

  const requestedToken = String(data.token || '').trim();
  const token = /^[A-Za-z0-9_-]{32,128}$/.test(requestedToken)
    ? requestedToken
    : Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');

  CacheService.getScriptCache().put('pn-review-admin:' + token, username, 21600);
  return {ok:true,token:token,expiresIn:21600,version:'6'};
}
"""

if old_login in text:
    text = text.replace(old_login, new_login)
elif "const requestedToken = String(data.token || '').trim();" not in text:
    raise SystemExit('reviewAdminLogin_ block not found')

p.write_text(text, encoding='utf-8')
print('Backend review v6 session token + GET admin list ready.')
