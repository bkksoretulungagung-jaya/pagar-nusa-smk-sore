from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old_btn = '    <button id="topLoginBtn" class="adminLoginBtn" type="button" onclick="openAdminLogin()">🔐 LOGIN ADMIN</button>\n'
if old_btn in s:
    s = s.replace(old_btn, '', 1)

style_anchor = '.bottomAdminLogin .adminLoginBtn{background:#14532d!important;border:0!important;border-radius:10px!important;padding:12px 24px!important;color:#fff!important;font-weight:900!important;box-shadow:0 4px 14px rgba(20,83,45,.18)!important}\n'
style_rule = '.footerAdminDisguise{display:block;margin:7px auto 15px;padding:0;border:0!important;background:transparent!important;box-shadow:none!important;color:#64748b;font-family:inherit;font-size:12px;line-height:1.4;font-weight:500;letter-spacing:0;cursor:pointer;text-align:center;text-decoration:none}\n.footerAdminDisguise:hover,.footerAdminDisguise:focus{background:transparent!important;box-shadow:none!important;color:#475569;text-decoration:none;outline:none}\n'
if '.footerAdminDisguise{' not in s:
    if style_anchor not in s:
        raise SystemExit('Anchor CSS tombol admin lama tidak ditemukan')
    s = s.replace(style_anchor, style_anchor + style_rule, 1)

footer = '<div class="footer">© 2026 Database Pagar Nusa Rayon SMK Sore Tulungagung</div>'
new_footer = footer + '\n<button id="topLoginBtn" class="footerAdminDisguise" type="button" onclick="openAdminLogin()" aria-label="Pagar Nusa Rayon SMK Sore Tulungagung">Pagar Nusa Rayon SMK Sore Tulungagung</button>'
if 'id="topLoginBtn" class="footerAdminDisguise"' not in s:
    if footer not in s:
        raise SystemExit('Footer copyright tidak ditemukan')
    s = s.replace(footer, new_footer, 1)

p.write_text(s, encoding='utf-8')
print('Akses admin dipindah ke bawah copyright sebagai teks tersamar.')
