/* =========================================================
   VK Global — main.js
   Vanilla JS for rendering, cart, contact, FAQ, animations
   ========================================================= */
(function(){
"use strict";

const CART_KEY = "stainless_trade_cart";
const COOKIE_KEY = "vk_cookie_choice";
const PER_PAGE = 9;

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
const fmt = n => "$"+n.toLocaleString("en-US");
const imgPath = i => "assets/images/"+i;
const qs = (k)=> new URLSearchParams(location.search).get(k);

/* ---------- Cart storage ---------- */
function getCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY))||[];}catch(e){return [];} }
function setCart(c){ localStorage.setItem(CART_KEY,JSON.stringify(c)); updateBadge(); }
function clearCart(){ localStorage.removeItem(CART_KEY); updateBadge(); }
function addToCart(id){
  if(!window.PRODUCTS) return;
  const p = window.PRODUCTS.find(x=>x.id===Number(id));
  if(!p) return;
  const cart = getCart();
  const ex = cart.find(x=>x.id===p.id);
  if(ex){ ex.quantity++; } else {
    cart.push({id:p.id,name:p.name,category:p.category,price:p.price,image:p.id+".webp",quantity:1});
  }
  setCart(cart);
  toast("Added to inquiry cart");
}
function updateBadge(){
  const cart = getCart();
  const total = cart.reduce((s,x)=>s+x.quantity,0);
  $$(".cart-badge").forEach(b=>{
    b.textContent = total;
    b.classList.toggle("show", total>0);
  });
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg){
  let t = $(".toast");
  if(!t){ t = document.createElement("div"); t.className="toast"; document.body.appendChild(t); }
  t.innerHTML = '<span class="ic">●</span> '+msg;
  requestAnimationFrame(()=>t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>t.classList.remove("show"), 2200);
}

/* ---------- Mobile nav ---------- */
function initNav(){
  const tog = $(".nav-toggle"); const links = $(".nav-links");
  if(tog && links){ tog.addEventListener("click",()=>links.classList.toggle("open")); }
  // mark active
  const path = location.pathname.split("/").pop() || "index.html";
  $$(".nav-links a").forEach(a=>{
    const href = a.getAttribute("href");
    if(href === path) a.classList.add("active");
  });
}

/* ---------- Cookie banner ---------- */
function initCookie(){
  if(localStorage.getItem(COOKIE_KEY)) return;
  const el = document.createElement("div");
  el.className="cookie-banner show";
  el.innerHTML = '<p>We use minimal local storage to remember your inquiry cart and your preferences. No tracking or third-party cookies.</p><div class="actions"><button class="btn btn-outline" data-cookie="decline" style="border-color:rgba(243,241,235,.35);color:#fff">Decline</button><button class="btn btn-copper" data-cookie="accept">Accept</button></div>';
  document.body.appendChild(el);
  el.addEventListener("click",e=>{
    const t = e.target.closest("[data-cookie]"); if(!t) return;
    localStorage.setItem(COOKIE_KEY, t.dataset.cookie);
    el.remove();
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal(){
  const els = $$(".reveal"); if(!els.length) return;
  const io = new IntersectionObserver(ents=>{
    ents.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} });
  },{threshold:.12});
  els.forEach(el=>io.observe(el));
}

/* ---------- Products page ---------- */
function renderProducts(){
  const wrap = $("#productGrid"); if(!wrap) return;
  if(!window.PRODUCTS){ wrap.innerHTML='<p class="text-center">Product data not found.</p>'; return; }
  const total = window.PRODUCTS.length;
  let page = Math.max(1, parseInt(qs("page")||"1",10));
  const pages = Math.ceil(total/PER_PAGE);
  if(page>pages) page=pages;
  const start = (page-1)*PER_PAGE;
  const slice = window.PRODUCTS.slice(start,start+PER_PAGE);

  wrap.innerHTML = slice.map(p=>`
    <article class="pcard reveal">
      <div class="imgwrap"><img src="${imgPath(p.id+".webp")}" alt="${p.name}" loading="lazy"></div>
      <div class="body">
        <span class="cat">${p.category}</span>
        <h3>${p.name}</h3>
        <p class="desc">${p.desc.split(".")[0]}.</p>
        <div class="price">${fmt(p.price)}</div>
        <div class="actions">
          <button class="btn btn-outline" data-add="${p.id}">Add to Cart</button>
          <a class="btn btn-primary" href="product-detail.html?id=${p.id}">View Detail</a>
        </div>
      </div>
    </article>`).join("");

  // count text
  const cn = $("#prodCount");
  if(cn) cn.textContent = `Showing ${start+1}–${Math.min(start+PER_PAGE,total)} of ${total} products`;

  // pagination
  const pg = $("#pagination");
  if(pg){
    let html = `<button data-page="${page-1}" ${page===1?"disabled":""}>← Prev</button>`;
    for(let i=1;i<=pages;i++){ html += `<button class="${i===page?"active":""}" data-page="${i}">${i}</button>`; }
    html += `<button data-page="${page+1}" ${page===pages?"disabled":""}>Next →</button>`;
    pg.innerHTML = html;
    pg.addEventListener("click",e=>{
      const b = e.target.closest("button[data-page]"); if(!b||b.disabled) return;
      const np = b.dataset.page;
      const u = new URL(location); u.searchParams.set("page",np);
      location.href = u.toString();
    },{once:true});
  }

  // add to cart
  wrap.addEventListener("click",e=>{
    const b = e.target.closest("[data-add]"); if(!b) return;
    addToCart(b.dataset.add);
  });

  initReveal();
}

/* ---------- Product detail ---------- */
function renderProductDetail(){
  const wrap = $("#productDetail"); if(!wrap) return;
  if(!window.PRODUCTS){ wrap.innerHTML='<p class="text-center">Product data is not loaded correctly.</p>'; return; }
  const id = Number(qs("id")||1);
  const p = window.PRODUCTS.find(x=>x.id===id);
  if(!p){ wrap.innerHTML='<p class="text-center">Product not found. <a href="products.html">Browse products</a>.</p>'; return; }

  const gallery = (window.PRODUCT_GALLERIES && window.PRODUCT_GALLERIES[p.id]) || [p.id+".webp"];

  document.title = p.name+" — VK Global";

  wrap.innerHTML = `
    <div class="pd">
      <div class="pd-gallery">
        <div class="pd-thumbs">
          ${gallery.map((g,i)=>`<button class="pd-thumb${i===0?" active":""}" data-src="${imgPath(g)}"><img src="${imgPath(g)}" alt="${p.name} view ${i+1}" onerror="this.parentNode.style.display='none'"></button>`).join("")}
        </div>
        <div class="pd-main"><img id="pdMain" src="${imgPath(gallery[0])}" alt="${p.name}"></div>
      </div>
      <div class="pd-info">
        <span class="cat">${p.category}</span>
        <h1>${p.name}</h1>
        <p>${p.desc}</p>
        <div class="price">${fmt(p.price)} <small>Indicative price · per unit / negotiable for bulk</small></div>
        <div class="pd-actions">
          <a class="btn btn-copper" href="contact.html?product=${p.id}">Ask About This Product</a>
          <a class="btn btn-outline" href="contact.html">Contact Us</a>
          <button class="btn btn-ghost" data-add="${p.id}">＋ Add to inquiry cart</button>
        </div>
        <div class="pd-specs">
          <h4>Specifications</h4>
          ${Object.entries(p.specs).map(([k,v])=>`<div class="row"><span>${k}</span><span>${v}</span></div>`).join("")}
          <div class="row"><span>Application</span><span>${p.use}</span></div>
          <div class="row"><span>Suitable Buyer</span><span>${p.buyer}</span></div>
        </div>
      </div>
    </div>`;

  // gallery switching
  const main = $("#pdMain");
  wrap.querySelectorAll(".pd-thumb").forEach(t=>{
    t.addEventListener("click",()=>{
      wrap.querySelectorAll(".pd-thumb").forEach(x=>x.classList.remove("active"));
      t.classList.add("active");
      main.src = t.dataset.src;
    });
  });
  // hide thumb if image failed to load (broken)
  wrap.querySelectorAll(".pd-thumb img").forEach(im=>{
    im.addEventListener("error",()=>{ im.parentNode.style.display="none"; });
  });
  wrap.querySelector("[data-add]").addEventListener("click",e=>addToCart(e.currentTarget.dataset.add));
}

/* ---------- Cart page ---------- */
function renderCart(){
  const wrap = $("#cartWrap"); if(!wrap) return;
  const cart = getCart();

  if(cart.length===0){
    wrap.innerHTML = `<div class="empty-cart" style="grid-column:1/-1">
        <div class="ic">⬚</div>
        <h2>Your inquiry cart is empty</h2>
        <p>Add products you're interested in, then contact us for a tailored quote.</p>
        <a class="btn btn-primary" href="products.html">Browse Products →</a>
      </div>`;
    return;
  }

  const total = cart.reduce((s,x)=>s+x.price*x.quantity,0);
  const count = cart.reduce((s,x)=>s+x.quantity,0);

  wrap.innerHTML = `
    <div class="cart-items">
      ${cart.map(it=>`
        <div class="cart-item" data-id="${it.id}">
          <div class="ci-img"><img src="${imgPath(it.image)}" alt="${it.name}"></div>
          <div class="ci-info">
            <span class="cat">${it.category}</span>
            <h3>${it.name}</h3>
            <div class="price">${fmt(it.price)} / unit</div>
          </div>
          <div class="ci-right">
            <div class="qty">
              <button data-act="dec">−</button>
              <span>${it.quantity}</span>
              <button data-act="inc">+</button>
            </div>
            <div class="ci-sub">${fmt(it.price*it.quantity)}</div>
            <button class="ci-remove" data-act="rm">Remove</button>
          </div>
        </div>`).join("")}
    </div>
    <aside class="cart-summary">
      <h3>Inquiry Summary</h3>
      <div class="ln"><span>Items</span><span>${count}</span></div>
      <div class="ln"><span>Unique products</span><span>${cart.length}</span></div>
      <div class="ln"><span>Estimated subtotal</span><span>${fmt(total)}</span></div>
      <div class="ttl"><span>Estimated total</span><span>${fmt(total)}</span></div>
      <div class="actions">
        <a class="btn btn-copper" href="contact.html?source=cart">Contact Us About Products →</a>
        <a class="btn btn-outline" href="products.html">Continue Shopping</a>
      </div>
      <p style="font-size:.78rem;color:rgba(243,241,235,.5);margin-top:18px;margin-bottom:0">Final pricing is confirmed by our trade team after inquiry. No online payment is processed.</p>
    </aside>`;

  wrap.addEventListener("click",e=>{
    const row = e.target.closest(".cart-item"); if(!row) return;
    const id = Number(row.dataset.id);
    const act = e.target.closest("[data-act]")?.dataset.act;
    if(!act) return;
    const cart = getCart();
    const it = cart.find(x=>x.id===id); if(!it) return;
    if(act==="inc") it.quantity++;
    if(act==="dec") it.quantity = Math.max(1, it.quantity-1);
    if(act==="rm")  cart.splice(cart.indexOf(it),1);
    setCart(cart);
    renderCart();
  });
}

/* ---------- Contact page ---------- */
function initContact(){
  const form = $("#contactForm"); if(!form) return;
  const productParam = qs("product");
  const source = qs("source");
  const typeAsk = $("#typeAsk"); const typeGen = $("#typeGen");
  const preview = $("#selectedPreview"); const message = $("#msgField");
  const success = $("#formSuccess");

  function buildSelected(){
    if(productParam && window.PRODUCTS){
      const p = window.PRODUCTS.find(x=>x.id===Number(productParam));
      if(p) return [{id:p.id,name:p.name,category:p.category,price:p.price,image:p.id+".webp",quantity:1}];
    }
    return getCart();
  }
  function autoFillMessage(items){
    if(!items.length) return "";
    let m = "Hello VK Global team,\n\nI would like to inquire about the following stainless steel products:\n\n";
    items.forEach((it,i)=>{
      m += `${i+1}. ${it.name}\n   Category: ${it.category}\n   Price: ${fmt(it.price)} / unit\n   Quantity: ${it.quantity}\n\n`;
    });
    m += "Please contact me with availability, lead time and a formal quotation.\n\nThank you.";
    return m;
  }
  function renderPreview(items){
    if(!items.length){ preview.style.display="none"; return; }
    preview.style.display = "block";
    const shown = items.slice(0,3);
    const hidden = items.length - shown.length;
    preview.innerHTML = `
      <h4>Selected products (${items.length})</h4>
      ${shown.map(it=>`
        <div class="sp-item">
          <div class="sp-img"><img src="${imgPath(it.image)}" alt="${it.name}"></div>
          <div>
            <h5>${it.name}</h5>
            <div class="meta">${it.category} · ${fmt(it.price)}</div>
          </div>
          <div class="qty-px">×${it.quantity}</div>
        </div>`).join("")}
      ${hidden>0?`<div class="sp-more">+${hidden} more · <a href="cart.html">View all / Back to cart</a></div>`:""}
    `;
  }
  function applyType(){
    const isAsk = typeAsk.checked;
    typeAsk.closest("label").classList.toggle("checked", isAsk);
    typeGen.closest("label").classList.toggle("checked", !isAsk);
    if(isAsk){
      const items = buildSelected();
      renderPreview(items);
      if(!message.dataset.userEdited){
        message.value = autoFillMessage(items);
      }
    } else {
      preview.style.display="none";
      if(!message.dataset.userEdited) message.value = "";
    }
  }

  message.addEventListener("input",()=>{ message.dataset.userEdited="1"; });

  typeAsk.addEventListener("change",applyType);
  typeGen.addEventListener("change",applyType);

  // Default: if came from cart or product link, choose Ask
  if(source==="cart" || productParam){
    typeAsk.checked = true;
  } else {
    typeGen.checked = true;
  }
  applyType();

  form.addEventListener("submit",e=>{
    e.preventDefault();
    success.classList.add("show");
    success.scrollIntoView({behavior:"smooth",block:"center"});
    const wasAsk = typeAsk.checked;
    const fromCart = !productParam; // if no specific product was passed, it's based on cart
    if(wasAsk && fromCart){ clearCart(); }
    form.reset();
    delete message.dataset.userEdited;
    // restore radio state but blank
    typeGen.checked = true; applyType();
    setTimeout(()=>success.classList.remove("show"), 6000);
  });
}

/* ---------- FAQ accordion ---------- */
function initFAQ(){
  $$(".faq-item").forEach(it=>{
    const q = it.querySelector(".faq-q");
    q.addEventListener("click",()=>{
      const open = it.classList.contains("open");
      $$(".faq-item").forEach(x=>x.classList.remove("open"));
      if(!open) it.classList.add("open");
    });
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded",()=>{
  initNav();
  updateBadge();
  initCookie();
  renderProducts();
  renderProductDetail();
  renderCart();
  initContact();
  initFAQ();
  initReveal();
});

// Expose for inline calls if ever needed
window.VK = { addToCart, clearCart, getCart };
})();
