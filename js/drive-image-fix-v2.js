(()=>{
'use strict';

function driveFileId(url){
  const s=String(url||'');
  let m=s.match(/[?&]id=([^&#]+)/i);
  if(m)return decodeURIComponent(m[1]);
  m=s.match(/drive\.google\.com\/file\/d\/([^/]+)/i);
  if(m)return m[1];
  m=s.match(/googleusercontent\.com\/d\/([^=/?&#]+)/i);
  return m?m[1]:'';
}

function normalizeDriveImage(url){
  const s=String(url||'');
  if(!/drive\.google\.com|googleusercontent\.com/i.test(s))return s;
  const id=driveFileId(s);
  if(!id)return s;
  return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w1600';
}

function apply(img){
  if(!img||img.tagName!=='IMG')return;
  const current=img.getAttribute('src')||'';
  const fixed=normalizeDriveImage(current);
  if(fixed&&fixed!==current){
    img.dataset.pnDriveId=driveFileId(current);
    img.src=fixed;
  }
  if(!img.dataset.pnDriveFallbackBound){
    img.dataset.pnDriveFallbackBound='1';
    img.addEventListener('error',()=>{
      const id=img.dataset.pnDriveId||driveFileId(img.getAttribute('src')||'');
      if(!id||img.dataset.pnDriveFallback==='1')return;
      img.dataset.pnDriveFallback='1';
      img.src='https://lh3.googleusercontent.com/d/'+encodeURIComponent(id)+'=w1600';
    });
  }
}

function scan(root=document){
  if(root&&root.tagName==='IMG')apply(root);
  if(root&&root.querySelectorAll)root.querySelectorAll('img').forEach(apply);
}

scan();
const observer=new MutationObserver(records=>{
  records.forEach(r=>{
    if(r.type==='attributes'&&r.target&&r.target.tagName==='IMG')apply(r.target);
    r.addedNodes&&r.addedNodes.forEach(scan);
  });
});
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src']});
window.pnNormalizeDriveImage=normalizeDriveImage;
})();

(()=>{
  if(document.querySelector('script[data-pn-cms-password-mask]'))return;
  const s=document.createElement('script');
  s.src='js/content-password-mask-v1.js?v=2';
  s.async=false;
  s.dataset.pnCmsPasswordMask='1';
  document.head.appendChild(s);
})();
