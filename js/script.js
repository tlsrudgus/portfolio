const poster = document.querySelectorAll(".poster img");
const comp = document.querySelectorAll(".comp img");
const logo = document.querySelectorAll(".logo img")
const char = document.querySelectorAll(".character img")
const after = document.querySelectorAll("#after img");
const pre = document.querySelectorAll("#premiere img");

const modal = document.querySelector("#modal");

poster.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const img = modal.querySelector("img")
  img.src = src;
  modal.style.display = "block";
}));

comp.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const img = modal.querySelector("img")
  img.src = src;
  modal.style.display = "block";
}))

logo.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const img = modal.querySelector("img")
  img.src = src;
  modal.style.display = "block";
}))

char.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const img = modal.querySelector("img")
  img.src = src;
  modal.style.display = "block";
}))

after.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const iframe = modal.querySelector("iframe");
  iframe.src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
  modal.style.display = "block";
}))

pre.forEach(el => el.addEventListener("click", () => {
  const src = el.dataset.src;
  //console.log(src)
  const iframe = modal.querySelector("iframe");
  iframe.src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
  modal.style.display = "block";
}))

modal.addEventListener("click", () => {
  modal.style.display = "none";
  const iframe = modal.querySelector("iframe");
  if(iframe){
    iframe.src = "";
  }
  const img = modal.querySelector("img")
  if(img){
    img.src = "";
  }
})
