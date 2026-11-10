// 연락처는 아래 두 줄만 수정하면 됩니다.
const CONTACT_EMAIL = "sjy7737399@gmail.com"; // 여기에 본인 이메일
const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@%EC%8B%A0%EA%B8%B0%ED%9B%88-q8g"; // 여기에 본인 유튜브 채널 주소

(() => {
  const mail = document.getElementById("featured-email");
  const youtube = document.getElementById("featured-youtube");
  if (mail) {
    mail.textContent = CONTACT_EMAIL;
    mail.href = `mailto:${CONTACT_EMAIL}`;
  }
  if (youtube) youtube.href = YOUTUBE_CHANNEL_URL;

  const dialog = document.getElementById("featured-modal");
  const content = document.getElementById("featured-modal-content");
  const close = document.getElementById("featured-close");
  let previousFocus = null;
  function closePreview() {
    dialog.hidden = true;
    content.replaceChildren(); // iframe 제거: 재생 중지
    document.body.style.overflow = "";
    if (previousFocus) previousFocus.focus();
  }
  document.querySelectorAll("#featured button[data-featured-kind]").forEach(button => {
    button.addEventListener("click", () => {
      const kind = button.dataset.featuredKind;
      const url = button.dataset.featuredUrl;
      content.replaceChildren();
      if (kind === "video") {
        const iframe = document.createElement("iframe");
        iframe.title = button.getAttribute("aria-label") || "대표 영상";
        iframe.src = url + (url.includes("?") ? "&" : "?") + "autoplay=1";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        iframe.allowFullscreen = true;
        content.append(iframe);
      } else if (kind === "image") {
        const img = document.createElement("img");
        img.alt = button.getAttribute("aria-label") || "대표 이미지";
        img.src = url;
        content.append(img);
      }
      previousFocus = document.activeElement;
      dialog.hidden = false;
      document.body.style.overflow = "hidden";
      close.focus();
    });
  });
  close.addEventListener("click", closePreview);
  dialog.addEventListener("click", event => {if (event.target === dialog) closePreview();});
  document.addEventListener("keydown", event => {
    if (!dialog.hidden && event.key === "Escape") closePreview();
    if (!dialog.hidden && event.key === "Tab") {
      event.preventDefault();
      close.focus();
    }
  });
})();
