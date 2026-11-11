/* 원본 이미지 클릭 이벤트는 유지하고, 썸네일에 장식만 추가합니다. */
(() => {
  'use strict';
  const groups = [
    { selector: '#premiere-gallery .box > img', kind: 'video' },
    { selector: '#aftereffect-gallery .box > img', kind: 'video' },
    { selector: '#illustrator .box-group .box > img[data-src]', kind: 'image' },
    { selector: '#photoshop .poster .box > img[data-src], #photoshop .comp .box > img[data-src]', kind: 'image' },
    { selector: '#fig .box-group .box > a > img', kind: 'external' },
  ];
  // 인라인 SVG 아이콘: ▶ 재생 / 돋보기 확대 / 외부 페이지 이동
  const icons = {
    video: '<path d="m9 6 10 6-10 6z" fill="currentColor" stroke="none"/>',
    image: '<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/><path d="M11 8v6M8 11h6"/>',
    external: '<path d="M13 4h7v7M20 4l-9 9"/><path d="M20 14v6H4V4h6"/>',
  };
  function update() {
    for (const { selector, kind } of groups) {
      for (const img of document.querySelectorAll(selector)) {
        if (img.parentElement?.classList.contains('portfolio-thumb-frame')) continue;
        const frame = document.createElement('span');
        frame.className = 'portfolio-thumb-frame';
        frame.dataset.thumbType = kind;
        const icon = document.createElement('span');
        icon.className = 'portfolio-thumb-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[kind]}</svg>`;
        // 이미지 DOM 노드를 그대로 옮겨 기존 등록된 클릭 핸들러를 보존합니다.
        img.before(frame);
        frame.append(img, icon);
      }
    }
  }
  update();
  // 새 작품을 관리자 모드에서 등록한 뒤에도 자동 적용
  const gallery = document.querySelector('#premiere-gallery, #aftereffect-gallery');
  if (gallery) {
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => { scheduled = false; update(); });
    });
    observer.observe(gallery, { childList: true, subtree: true });
  }
})();
