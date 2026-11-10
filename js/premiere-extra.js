/* 새로 게시된 작품만 읽어 기존 4개 카드 뒤에 붙입니다. */
(() => {
  const gallery = document.getElementById('premiere-gallery');
  if (!gallery) return;
  const safeUrl = value => {try {const u = new URL(value, location.href);return ['http:', 'https:'].includes(u.protocol) ? u.href : '';}catch{return '';}};
  const youtube = value => {try {const u = new URL(value), host=u.hostname.replace(/^www\./,'');let id='';if(host==='youtu.be')id=u.pathname.split('/')[1];else if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=u.searchParams.get('v')||u.pathname.split('/')[2];return /^[\w-]{11}$/.test(id)?`https://www.youtube-nocookie.com/embed/${id}`:'';}catch{return '';}};
  const render = items => {
    gallery.querySelectorAll('.portfolio-added').forEach(el=>el.remove());
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || !item.title || !safeUrl(item.thumb) || !safeUrl(item.url)) continue;
      const card=document.createElement('div');card.className='box portfolio-added';
      const title=document.createElement('h2');title.textContent=item.title;
      const thumb=document.createElement('img');thumb.src=safeUrl(item.thumb);thumb.alt=item.title;thumb.loading='lazy';thumb.tabIndex=0;thumb.setAttribute('role','button');
      const open=()=>{
        const modal=document.getElementById('modal');if(!modal)return;
        const wrapper=modal.querySelector('.box'), iframe=wrapper?.querySelector('iframe');if(!wrapper)return;
        if(iframe){iframe.src='';iframe.style.display='none';}
        wrapper.querySelectorAll('.portfolio-file-video,.portfolio-external-link,.portfolio-image-viewer').forEach(el=>el.remove());
        const url=safeUrl(item.url), embed=youtube(url);
        if(embed&&iframe){iframe.style.display='block';iframe.src=embed+'?autoplay=1';}
        else if(item.kind==='image'||/\.(png|jpe?g|webp|gif)(\?|$)/i.test(url)){
          const img=document.createElement('img');img.className='portfolio-image-viewer';img.src=url;img.alt=item.title;wrapper.append(img);
        }else if(item.kind==='file'||item.kind==='video'||/\.(mp4|webm|ogg)(\?|$)/i.test(url)){
          const video=document.createElement('video');video.className='portfolio-file-video';video.controls=true;video.autoplay=true;video.src=url;wrapper.append(video);
        }else{
          const link=document.createElement('a');link.className='portfolio-external-link';link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='전체 작품 새 창에서 보기 ↗';wrapper.append(link);
        }
        modal.style.display='block';
      };
      thumb.addEventListener('click',open);thumb.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();open();}});
      card.append(title,thumb); const add=gallery.querySelector('.manager-add-card'); if(add)gallery.insertBefore(card,add);else gallery.append(card);
    }
  };
  window.reloadPremiereExtras=()=>fetch('data/premiere-extra.json?t='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('작품 목록을 읽지 못했습니다.');return r.json();}).then(render);
  window.reloadPremiereExtras().catch(console.warn);
  document.getElementById('modal')?.addEventListener('click',()=>{
    document.querySelectorAll('.portfolio-file-video,.portfolio-image-viewer,.portfolio-external-link').forEach(el=>{if(el.pause)el.pause();el.remove();});
    const frame=document.querySelector('#modal iframe');if(frame)frame.style.display='block';
  });
})();
