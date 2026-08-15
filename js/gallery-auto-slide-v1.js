(()=>{
'use strict';

const SECTION='#gallerySection';
const STRIP='.galleryStrip';
const ITEM='.galleryItem';
let timer=null;
let restartTimer=null;
let observer=null;
let boundStrip=null;
let index=0;
let paused=false;

function ensureStyles(){
  if(document.getElementById('pnGalleryAutoSlideStyles'))return;
  const s=document.createElement('style');
  s.id='pnGalleryAutoSlideStyles';
  s.textContent=`
    #gallerySection{position:relative}
    #gallerySection .galleryStrip{display:flex!important;grid-template-columns:none!important;gap:12px!important;overflow-x:auto!important;overflow-y:hidden!important;scroll-snap-type:x mandatory;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;padding-bottom:5px;scrollbar-width:none}
    #gallerySection .galleryStrip::-webkit-scrollbar{display:none}
    #gallerySection .galleryItem{flex:0 0 calc((100% - 24px)/3)!important;min-width:0!important;scroll-snap-align:start}
    #gallerySection .pnGallerySlideNav{display:flex;justify-content:center;align-items:center;gap:8px;margin-top:10px}
    #gallerySection .pnGallerySlideDot{width:7px;height:7px;padding:0;border:0;border-radius:50%;background:#cbd5e1;cursor:pointer;transition:transform .2s ease,background .2s ease}
    #gallerySection .pnGallerySlideDot.active{background:#166534;transform:scale(1.35)}
    @media(max-width:800px){#gallerySection .galleryItem{flex-basis:84%!important}}
    @media(prefers-reduced-motion:reduce){#gallerySection .galleryStrip{scroll-behavior:auto}}
  `;
  document.head.appendChild(s);
}

function items(){return Array.from(document.querySelectorAll(`${SECTION} ${STRIP} ${ITEM}`)).filter(el=>el.offsetParent!==null)}
function strip(){return document.querySelector(`${SECTION} ${STRIP}`)}

function nav(){
  const section=document.querySelector(SECTION);if(!section)return null;
  let n=section.querySelector('.pnGallerySlideNav');
  if(!n){n=document.createElement('div');n.className='pnGallerySlideNav';n.setAttribute('aria-label','Navigasi slide galeri');section.appendChild(n)}
  return n;
}

function updateDots(){
  const arr=items(),n=nav();if(!n)return;
  if(n.children.length!==arr.length){
    n.innerHTML='';
    arr.forEach((_,i)=>{
      const b=document.createElement('button');b.type='button';b.className='pnGallerySlideDot';b.setAttribute('aria-label',`Tampilkan foto ${i+1}`);b.addEventListener('click',()=>go(i,true));n.appendChild(b)
    });
  }
  Array.from(n.children).forEach((d,i)=>d.classList.toggle('active',i===index));
  n.style.display=arr.length>1?'flex':'none';
}

function go(i,user=false){
  const arr=items(),box=strip();if(!box||!arr.length)return;
  index=((i%arr.length)+arr.length)%arr.length;
  const target=arr[index];
  box.scrollTo({left:target.offsetLeft-box.offsetLeft,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  updateDots();
  if(user)restart();
}

function next(){const arr=items();if(arr.length>1&&!paused)go(index+1)}
function start(){stop();if(items().length>1&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)timer=setInterval(next,3800)}
function stop(){if(timer){clearInterval(timer);timer=null}}
function restart(){stop();clearTimeout(restartTimer);restartTimer=setTimeout(start,1800)}

function bind(box){
  if(boundStrip===box)return;
  boundStrip=box;
  box.addEventListener('mouseenter',()=>{paused=true;stop()});
  box.addEventListener('mouseleave',()=>{paused=false;start()});
  box.addEventListener('focusin',()=>{paused=true;stop()});
  box.addEventListener('focusout',()=>{paused=false;start()});
  box.addEventListener('touchstart',()=>{paused=true;stop()},{passive:true});
  box.addEventListener('touchend',()=>{paused=false;restart()},{passive:true});
  box.addEventListener('scroll',()=>{
    clearTimeout(box._pnGalleryScrollTimer);
    box._pnGalleryScrollTimer=setTimeout(()=>{
      const arr=items();if(!arr.length)return;
      let best=0,dist=Infinity;
      arr.forEach((el,i)=>{const d=Math.abs(el.offsetLeft-box.offsetLeft-box.scrollLeft);if(d<dist){dist=d;best=i}});
      index=best;updateDots();
    },120);
  },{passive:true});
}

function install(){
  ensureStyles();
  const box=strip();if(!box)return;
  bind(box);
  const arr=items();if(index>=arr.length)index=0;
  updateDots();start();
  if(!observer){
    observer=new MutationObserver(()=>{clearTimeout(restartTimer);restartTimer=setTimeout(()=>{updateDots();start()},250)});
    observer.observe(box,{childList:true,subtree:false});
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
setTimeout(install,700);
setTimeout(install,1800);
})();
