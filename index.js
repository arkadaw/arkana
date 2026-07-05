
const popup = document.getElementById("popup");
const popupImg = document.getElementById("popup-img");
const popupTitle = document.getElementById("popup-title");

const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const closeBtn = document.getElementById("close-popup");

let images = [];
let index = 0;
let currentTitle = "";

// =====================
// SHOW IMAGE
// =====================
function showImage(){
  popupImg.src = images[index];
  popupTitle.textContent = currentTitle;

  resetZoom(); // مهم: هر بار عکس عوض شد زوم ریست شه
}

// =====================
// NEXT / PREV
// =====================
function next(){
  if(index < images.length - 1){
    index++;
    showImage();
  }
}

function prev(){
  if(index > 0){
    index--;
    showImage();
  }
}




// =====================
// BUTTON EVENTS
// =====================
nextBtn.addEventListener("click", prev);
prevBtn.addEventListener("click", next);

// =====================
// CLOSE POPUP
// =====================
closeBtn.addEventListener("click", () => {
  popup.style.display = "none";
});

// =====================
// ZOOM SYSTEM (SIMPLE & STABLE)
// =====================
let scale = 1;

function applyTransform(){
  popupImg.style.transform = `scale(${scale})`;
}

function resetZoom(){
  scale = 1;
  applyTransform();
}

// wheel zoom (PC)
popupImg.addEventListener("wheel", (e)=>{
  e.preventDefault();

  scale += e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.min(Math.max(scale, 1), 3);

  applyTransform();
},{ passive:false });

// double click zoom
popupImg.addEventListener("dblclick", ()=>{
  scale = (scale === 1) ? 2 : 1;
  applyTransform();
});

// =====================
// OPEN GALLERY
// =====================
document.querySelectorAll(".gallery").forEach(gallery => {

  const sectionTitle = gallery.previousElementSibling;

  gallery.querySelectorAll("img").forEach((img, i)=>{

    img.addEventListener("click", ()=>{

  images = Array.from(gallery.querySelectorAll("img")).map(x => x.src);
  index = i;

  // title درست و تمیز
  currentTitle = sectionTitle?.dataset.title || sectionTitle?.textContent || "";

  popup.style.display = "flex";
  history.pushState({ popup: true }, ""); // این خط را اضافه کن
  showImage();
});

  });

});

//منوی همبرگری
function toggleMenu() {
  const menu = document.getElementById("mobileMenu");

  if(menu.classList.contains("show")){
    closeMenu();
  }else{
    menu.classList.add("show");
    history.pushState({menu:true},"");
  }
}

function closeMenu() {
  document.getElementById("mobileMenu").classList.remove("show");
}

window.addEventListener("popstate", function () {

  if (popup.style.display === "flex") {
    popup.style.display = "none";
    resetZoom();
    return;
  }

  closeMenu();
});

