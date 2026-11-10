/* 기존 프리미어 작품은 유지하고, 새 작품·작품별 팝업 위치만 추가합니다. */
(() => {
  'use strict';
  const gallery = document.getElementById('premiere-gallery');
  const modal = document.getElementById('modal');
  if (!gallery || !modal) return;
  const box = modal.querySelector('.box');
  const iframe = box?.querySelector('iframe');
  const legacyCards = [...gallery.querySelectorAll(':scope > .box')];
  legacyCards.forEach((card, index) => { card.dataset.portfolioId = 'legacy-' + index; });
  const defaults = {x: 50, y: 50, size: 70};
  let items = [];
  let layouts = {};
  let activeId = null;
  const safeUrl = value => { try { const u = new URL(value, location.href); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
  const youtube = value => { try { const u = new URL(value), host=u.hostname.replace(/^www\./,''); let id=''; if(host==='youtu.be') id=u.pathname.split('/')[1]; else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host)) id=u.searchParams.get('v') || u.pathname.split('/')[2]; return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : ''; }catch{return '';} };
  const norm = value => ({x: Math.max(10,Math.min(90,Number(value?.x) || 50)), y: Math.max(10,Math.min(90,Number(value?.y) || 50)), size: Math.max(30,Math.min(95,Number(value?.size) || 70))});
  const positionOf = id => norm(id.startsWith('legacy-') ? layouts[id] : items.find(a=>a.id===id)?.position);
  function positionModal(position) {
    const p=norm(position);
    modal.style.setProperty('--portfolio-popup-x',p.x+'%');
    modal.style.setProperty('--portfolio-popup-y',p.y+'%');
    modal.style.setProperty('--portfolio-popup-size',p.size+'vw');
    modal.classList.add('portfolio-popup-open');
  }
  function showModalFor(id) {activeId=id;positionModal(positionOf(id));}
  // 기존 카드의 기본 유튜브 클릭 동작은 건드리지 않고 위치만 지정합니다.
  legacyCards.forEach(card => {
    const img=card.querySelector('img[data-src]');
    if(img) img.addEventListener('click',()=>{clearAddedContent();showModalFor(card.dataset.portfolioId);},true);
  });
  function clearAddedContent(){
    box?.querySelectorAll('.portfolio-file-video,.portfolio-external-link,.portfolio-image-viewer').forEach(el=>{if(el.pause)el.pause();el.remove();});
    if(iframe){iframe.src='';iframe.style.display='block';}
  }
  function openAdded(item){
    clearAddedContent();showModalFor(item.id);
    if(iframe){iframe.style.display='none';}
    const url=safeUrl(item.url), embed=youtube(url);
    if(embed && iframe){ iframe.style.display='block';iframe.src=embed+'?autoplay=1'; }
    else if(item.kind==='image'){
      const img=document.createElement('img');img.className='portfolio-image-viewer';img.src=url;img.alt=item.title;box.append(img);
    }else if(item.kind==='file'||item.kind==='video'){
      const video=document.createElement('video');video.className='portfolio-file-video';video.controls=true;video.autoplay=true;video.src=url;box.append(video);
    }else{
      const link=document.createElement('a');link.className='portfolio-external-link';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='전체 작품 새 창에서 보기 ↗';box.append(link);
    }
    modal.style.display='block';
  }
  function render(next){
    if(!Array.isArray(next))return;
    items=next;
    gallery.querySelectorAll('.portfolio-added').forEach(el=>el.remove());
    for(const item of items){
      if(!item || !item.id || !item.title || !safeUrl(item.thumb) || !safeUrl(item.url))continue;
      const card=document.createElement('div');card.className='box portfolio-added';card.dataset.portfolioId=item.id;
      const title=document.createElement('h2');title.textContent=item.title;
      const thumb=document.createElement('img');thumb.src=safeUrl(item.thumb);thumb.alt=item.title;thumb.loading='lazy';thumb.tabIndex=0;thumb.setAttribute('role','button');
      thumb.addEventListener('click',()=>openAdded(item));
      thumb.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openAdded(item);}});
      card.append(title,thumb);
      const add=gallery.querySelector('.manager-add-card');if(add)gallery.insertBefore(card,add);else gallery.append(card);
    }
    window.refreshManagerCards?.();
  }
  const readJson = async (path,fallback) => {const response=await fetch(path+'?t='+Date.now(),{cache:'no-store'});if(response.status===404)return fallback;if(!response.ok)throw Error('작품 정보를 불러오지 못했습니다.');return response.json();};
  window.reloadPremiereExtras=async()=>{const [newItems,newLayouts]=await Promise.all([readJson('data/premiere-extra.json',[]),readJson('data/premiere-layout.json',{})]);layouts=newLayouts && typeof newLayouts==='object' && !Array.isArray(newLayouts)?newLayouts:{};render(newItems);};
  window.renderPremiereExtras=render;
  window.setPremiereLayouts=next=>{layouts=next || {};};
  window.getPremiereLayout=id=>positionOf(id);
  window.getPremiereItems=()=>items;
  window.previewPremierePosition=position=>positionModal(position);
  window.getPremiereCard=id=>gallery.querySelectorAll('.box[data-portfolio-id]').length && [...gallery.querySelectorAll('.box[data-portfolio-id]')].find(el=>el.dataset.portfolioId===id);
  modal.addEventListener('click',event=>{
    // 기본 script.js가 닫기 처리합니다. 별도 삽입 미디어만 제거합니다.
    clearAddedContent();
    activeId=null;
  });
  window.reloadPremiereExtras().catch(console.warn);
})();
