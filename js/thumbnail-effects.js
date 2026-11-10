/* 기존 재생/확대/외부링크 이벤트는 그대로 두고 시각 요소만 감쌉니다. */
(() => {
  'use strict';
  const groups = [
    { selector: '#premiere-gallery .box > img', kind: 'video' },
    { selector: '#aftereffect-gallery .box > img', kind: 'video' },
    { selector: '#illustrator .box-group .box > img[data-src]', kind: 'image' },
    { selector: '#photoshop .poster .box > img[data-src], #photoshop .comp .box > img[data-src]', kind: 'image' },
    { selector: '#fig .box-group .box > a > img', kind: 'external' },
  ];
  function update() {
    for (const { selector, kind } of groups) {
      for (const img of document.querySelectorAll(selector)) {
        if (img.parentElement?.classList.contains('portfolio-thumb-frame')) continue;
        // 기존 이미지 노드를 그대로 이동시키므로 연결된 클릭 이벤트는 유지됩니다.
        const frame = document.createElement('span');
        frame.className = 'portfolio-thumb-frame';
        frame.dataset.thumbType = kind;
        img.before(frame);
        frame.appendChild(img);
      }
    }
  }
  update();
  // 새 작품이 관리자 기능을 통해 동적으로 추가될 때도 같은 디자인 적용
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
