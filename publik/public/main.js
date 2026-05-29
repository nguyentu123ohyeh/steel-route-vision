/* =========================================================
   VK Global — main.js
   Vanilla JS for product catalogue, inquiry cart, contact, FAQ, animations
   No product prices / no checkout / inquiry-only workflow
   ========================================================= */
(function(){
"use strict";

const CART_KEY = "stainless_trade_cart";
const COOKIE_KEY = "vk_cookie_choice";
const PER_PAGE = 9;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const qs = (k) => new URLSearchParams(location.search).get(k);

const PRODUCT_IMAGE_BASE = window.PRODUCT_IMAGE_BASE || "assets/images/product/";

/* ---------- Safe helpers ---------- */
function productList(){
  return Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
}

function getProduct(id){
  return productList().find(p => Number(p.id) === Number(id));
}

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[ch]));
}

function firstSentence(text){
  const s = String(text || "").trim();
  if(!s) return "Technical stainless steel product available for inquiry.";
  const parts = s.split(".");
  return (parts[0] || s).trim() + ".";
}

function resolveImage(src, fallbackId){
  if(src && /^(https?:)?\/\//i.test(src)) return src;
  if(src && src.startsWith("assets/")) return src;
  if(src && src.includes("/")) return src;
  if(src) return PRODUCT_IMAGE_BASE + src;
  if(fallbackId) return PRODUCT_IMAGE_BASE + fallbackId + ".webp";
  return PRODUCT_IMAGE_BASE + "1.webp";
}

function galleryForProduct(p){
  let raw = [];

  if(Array.isArray(p.images) && p.images.length){
    raw = p.images;
  } else if(window.PRODUCT_GALLERIES && window.PRODUCT_GALLERIES[p.id]){
    raw = window.PRODUCT_GALLERIES[p.id];
  } else {
    raw = [p.image || `${p.id}.webp`];
  }

  const resolved = raw.map(x => resolveImage(x, p.id));
  const main = resolveImage(p.image, p.id);

  return Array.from(new Set([main, ...resolved]));
}

function productMetaLine(p){
  const specs = p.specs || {};
  const bits = [
    specs.Grade,
    specs["Outer Diameter"],
    specs.Diameter,
    specs.Length,
    specs.Width,
    specs.Thickness
  ].filter(Boolean);

  return bits.slice(0, 3).join(" · ");
}

function productChips(p){
  const specs = p.specs || {};
  const chips = [
    specs.Grade,
    specs["Tube Size"],
    specs["Outer Diameter"],
    specs.Diameter,
    specs.Length,
    specs.Width,
    specs.Thickness,
    specs.Pack
  ].filter(Boolean);

  return chips.slice(0, 3);
}

/* ---------- Header hide on scroll ---------- */
function initHeaderScroll(){
  const header = $(".site-header");
  if(!header) return;

  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateHeader(){
    const currentScrollY = window.scrollY;
    const navLinks = $(".nav-links");

    if(navLinks && navLinks.classList.contains("open")){
      header.classList.remove("header-hidden");
      lastScrollY = currentScrollY;
      ticking = false;
      return;
    }

    if(currentScrollY > lastScrollY && currentScrollY > 120){
      header.classList.add("header-hidden");
    } else {
      header.classList.remove("header-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if(!ticking){
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });
}

/* ---------- Cart storage ---------- */
function getCart(){
  try{
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    return Array.isArray(cart) ? cart : [];
  }catch(e){
    return [];
  }
}

function normalizeCartItem(item){
  const p = getProduct(item.id);
  if(!p){
    return {
      id: item.id,
      name: item.name || "Selected product",
      category: item.category || "Product Inquiry",
      image: resolveImage(item.image, item.id),
      quantity: Math.max(1, Number(item.quantity) || 1)
    };
  }

  return {
    id: p.id,
    name: p.name,
    category: p.category,
    sku: p.sku || "",
    image: resolveImage(p.image || item.image, p.id),
    quantity: Math.max(1, Number(item.quantity) || 1)
  };
}

function getNormalizedCart(){
  return getCart().map(normalizeCartItem);
}

function setCart(cart){
  const clean = cart.map(item => ({
    id: Number(item.id),
    quantity: Math.max(1, Number(item.quantity) || 1)
  }));
  localStorage.setItem(CART_KEY, JSON.stringify(clean));
  updateBadge();
}

function clearCart(){
  localStorage.removeItem(CART_KEY);
  updateBadge();
}

function addToCart(id){
  const p = getProduct(id);
  if(!p){
    toast("Product data is not loaded correctly");
    return;
  }

  const cart = getCart();
  const ex = cart.find(x => Number(x.id) === Number(p.id));

  if(ex){
    ex.quantity = Math.max(1, Number(ex.quantity) || 1) + 1;
  } else {
    cart.push({ id: p.id, quantity: 1 });
  }

  setCart(cart);
  toast("Added to inquiry cart");
}

function updateBadge(){
  const total = getCart().reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  $$(".cart-badge").forEach(badge => {
    badge.textContent = total;
    badge.classList.toggle("show", total > 0);
  });
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg){
  let t = $(".toast");
  if(!t){
    t = document.createElement("div");
    t.className = "toast";
    document.body.appendChild(t);
  }

  t.innerHTML = '<span class="ic">●</span> ' + escapeHtml(msg);
  requestAnimationFrame(() => t.classList.add("show"));

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

/* ---------- Mobile nav ---------- */
function initNav(){
  const toggle = $(".nav-toggle");
  const links = $(".nav-links");

  if(toggle && links){
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }

  const path = location.pathname.split("/").pop() || "index.html";
  $$(".nav-links a").forEach(a => {
    const href = a.getAttribute("href");
    if(href === path) a.classList.add("active");
  });
}

/* ---------- Cookie banner ---------- */
function initCookie(){
  if(localStorage.getItem(COOKIE_KEY)) return;

  const el = document.createElement("div");
  el.className = "cookie-banner show";
  el.innerHTML = `
    <p>We use minimal local storage to remember your inquiry cart and preferences. No checkout, payment tracking or third-party advertising cookies are used.</p>
    <div class="actions">
      <button class="btn btn-outline" data-cookie="decline" style="border-color:rgba(243,241,235,.35);color:#fff">Decline</button>
      <button class="btn btn-copper" data-cookie="accept">Accept</button>
    </div>
  `;

  document.body.appendChild(el);
  el.addEventListener("click", e => {
    const btn = e.target.closest("[data-cookie]");
    if(!btn) return;
    localStorage.setItem(COOKIE_KEY, btn.dataset.cookie);
    el.remove();
  });
}

/* ---------- Scroll reveal ---------- */
function initReveal(){
  const els = $$(".reveal");
  if(!els.length) return;

  if(!("IntersectionObserver" in window)){
    els.forEach(el => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });

  els.forEach(el => io.observe(el));
}

/* ---------- Products page ---------- */
function renderProducts(){
  const wrap = $("#productGrid");
  if(!wrap) return;

  const products = productList();
  if(!products.length){
    wrap.innerHTML = '<p class="text-center">Product data not found.</p>';
    return;
  }

  const total = products.length;
  let page = Math.max(1, parseInt(qs("page") || "1", 10));
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  if(page > pages) page = pages;

  const start = (page - 1) * PER_PAGE;
  const slice = products.slice(start, start + PER_PAGE);

  wrap.innerHTML = slice.map(p => {
    const chips = productChips(p);
    return `
      <article class="pcard reveal">
        <div class="imgwrap">
          <img src="${resolveImage(p.image, p.id)}" alt="${escapeHtml(p.name)}" loading="lazy">
        </div>
        <div class="body">
          <span class="cat">${escapeHtml(p.category)}</span>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="desc">${escapeHtml(firstSentence(p.desc))}</p>
          ${chips.length ? `<div class="spec-chips">${chips.map(c => `<span>${escapeHtml(c)}</span>`).join("")}</div>` : ""}
          <div class="actions">
            <button class="btn btn-outline" data-add="${p.id}">Add to Inquiry</button>
            <a class="btn btn-primary" href="product-detail.html?id=${p.id}">View Detail</a>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const count = $("#prodCount");
  if(count){
    count.textContent = `Showing ${start + 1}–${Math.min(start + PER_PAGE, total)} of ${total} inquiry products`;
  }

  const pagination = $("#pagination");
  if(pagination){
    let html = `<button data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>← Prev</button>`;
    for(let i = 1; i <= pages; i++){
      html += `<button class="${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
    }
    html += `<button data-page="${page + 1}" ${page === pages ? "disabled" : ""}>Next →</button>`;
    pagination.innerHTML = html;

    pagination.addEventListener("click", e => {
      const b = e.target.closest("button[data-page]");
      if(!b || b.disabled) return;

      const u = new URL(location);
      u.searchParams.set("page", b.dataset.page);
      location.href = u.toString();
    }, { once: true });
  }

  wrap.addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if(!b) return;
    addToCart(b.dataset.add);
  });

  initReveal();
}

/* ---------- Product detail ---------- */
function renderProductDetail(){
  const wrap = $("#productDetail");
  if(!wrap) return;

  const products = productList();
  if(!products.length){
    wrap.innerHTML = '<p class="text-center">Product data is not loaded correctly.</p>';
    return;
  }

  const id = Number(qs("id") || products[0].id);
  const p = getProduct(id);

  if(!p){
    wrap.innerHTML = '<p class="text-center">Product not found. <a href="products.html">Browse products</a>.</p>';
    return;
  }

  const gallery = galleryForProduct(p);
  const metaLine = productMetaLine(p);

  document.title = p.name + " — VK Global";

  wrap.innerHTML = `
    <div class="pd">
      <div class="pd-gallery">
        <div class="pd-thumbs">
          ${gallery.map((src, i) => `
            <button class="pd-thumb${i === 0 ? " active" : ""}" data-src="${src}">
              <img src="${src}" alt="${escapeHtml(p.name)} view ${i + 1}">
            </button>
          `).join("")}
        </div>
        <div class="pd-main">
          <img id="pdMain" src="${gallery[0]}" alt="${escapeHtml(p.name)}">
        </div>
      </div>

      <div class="pd-info">
        <span class="cat">${escapeHtml(p.category)}</span>
        <h1>${escapeHtml(p.name)}</h1>
        ${metaLine ? `<div class="pd-meta-line">${escapeHtml(metaLine)}</div>` : ""}
        <p>${escapeHtml(p.desc)}</p>

        <div class="pd-actions">
          <a class="btn btn-copper" href="contact.html?product=${p.id}">Ask About This Product</a>
          <a class="btn btn-outline" href="contact.html">Contact Trade Desk</a>
          <button class="btn btn-ghost" data-add="${p.id}">＋ Add to inquiry cart</button>
        </div>

        <div class="pd-specs">
          <h4>Technical Information</h4>
          ${Object.entries(p.specs || {}).map(([k, v]) => `
            <div class="row"><span>${escapeHtml(k)}</span><span>${escapeHtml(v)}</span></div>
          `).join("")}
          <div class="row"><span>Application</span><span>${escapeHtml(p.use || "Industrial and B2B stainless steel supply inquiry.")}</span></div>
          <div class="row"><span>Suitable Buyer</span><span>${escapeHtml(p.buyer || "B2B buyers, fabricators and industrial procurement teams.")}</span></div>
        </div>
      </div>
    </div>
  `;

  const main = $("#pdMain", wrap);

  $$(".pd-thumb", wrap).forEach(t => {
    t.addEventListener("click", () => {
      $$(".pd-thumb", wrap).forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      main.src = t.dataset.src;
    });
  });

  $$(".pd-thumb img", wrap).forEach(img => {
    img.addEventListener("error", () => {
      img.parentNode.style.display = "none";
    });
  });

  main.addEventListener("error", () => {
    main.src = resolveImage(p.image, p.id);
  }, { once: true });

  const addBtn = wrap.querySelector("[data-add]");
  if(addBtn){
    addBtn.addEventListener("click", e => addToCart(e.currentTarget.dataset.add));
  }
}

/* ---------- Cart page ---------- */
function renderCart(){
  const wrap = $("#cartWrap");
  if(!wrap) return;

  const cart = getNormalizedCart();

  if(cart.length === 0){
    wrap.innerHTML = `
      <div class="empty-cart" style="grid-column:1/-1">
        <div class="ic">⬚</div>
        <h2>Your inquiry cart is empty</h2>
        <p>Add products you are interested in, then contact us for product availability, specifications and logistics support.</p>
        <a class="btn btn-primary" href="products.html">Browse Products →</a>
      </div>
    `;
    return;
  }

  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  wrap.innerHTML = `
    <div class="cart-items">
      ${cart.map(item => {
        const p = getProduct(item.id) || {};
        const meta = productMetaLine(p);
        return `
          <div class="cart-item" data-id="${item.id}">
            <div class="ci-img">
              <img src="${item.image}" alt="${escapeHtml(item.name)}">
            </div>
            <div class="ci-info">
              <span class="cat">${escapeHtml(item.category)}</span>
              <h3>${escapeHtml(item.name)}</h3>
              ${meta ? `<div class="cart-meta">${escapeHtml(meta)}</div>` : ""}
              ${item.sku ? `<div class="cart-sku">${escapeHtml(item.sku)}</div>` : ""}
            </div>
            <div class="ci-right">
              <div class="qty">
                <button data-act="dec" aria-label="Decrease quantity">−</button>
                <span>${item.quantity}</span>
                <button data-act="inc" aria-label="Increase quantity">+</button>
              </div>
              <div class="ci-sub">Inquiry Qty: ${item.quantity}</div>
              <button class="ci-remove" data-act="rm">Remove</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <aside class="cart-summary">
      <h3>Inquiry Summary</h3>
      <div class="ln"><span>Total quantity</span><span>${count}</span></div>
      <div class="ln"><span>Unique products</span><span>${cart.length}</span></div>
      <div class="ln"><span>Inquiry type</span><span>B2B Product Request</span></div>
      <div class="ttl"><span>Status</span><span>Ready to Send</span></div>
      <div class="actions">
        <a class="btn btn-copper" href="contact.html?source=cart">Contact Us About Products →</a>
        <a class="btn btn-outline" href="products.html">Continue Browsing</a>
      </div>
      <p style="font-size:.78rem;color:rgba(243,241,235,.58);margin-top:18px;margin-bottom:0">
        This is an inquiry cart only. Final availability, technical requirements, packing and logistics details are confirmed by our trade desk.
      </p>
    </aside>
  `;

  wrap.addEventListener("click", e => {
    const row = e.target.closest(".cart-item");
    if(!row) return;

    const action = e.target.closest("[data-act]")?.dataset.act;
    if(!action) return;

    const id = Number(row.dataset.id);
    const rawCart = getCart();
    const item = rawCart.find(x => Number(x.id) === id);
    if(!item) return;

    if(action === "inc") item.quantity = Math.max(1, Number(item.quantity) || 1) + 1;
    if(action === "dec") item.quantity = Math.max(1, (Number(item.quantity) || 1) - 1);
    if(action === "rm") rawCart.splice(rawCart.indexOf(item), 1);

    setCart(rawCart);
    renderCart();
  });
}

/* ---------- Contact page ---------- */
function initContact(){
  const form = $("#contactForm");
  if(!form) return;

  const productParam = qs("product");
  const source = qs("source");

  const typeAsk = $("#typeAsk");
  const typeGen = $("#typeGen");
  const preview = $("#selectedPreview");
  const message = $("#msgField");
  const success = $("#formSuccess");

  if(!typeAsk || !typeGen || !preview || !message) return;

  function buildSelected(){
    if(productParam){
      const p = getProduct(productParam);
      if(p){
        return [{
          id: p.id,
          name: p.name,
          category: p.category,
          sku: p.sku || "",
          image: resolveImage(p.image, p.id),
          quantity: 1
        }];
      }
    }

    return getNormalizedCart();
  }

  function autoFillMessage(items){
    if(!items.length){
      return "Hello VK Global team,\n\nI would like to ask about your stainless steel products and trade support.\n\nPlease contact me with more information.\n\nThank you.";
    }

    let text = "Hello VK Global team,\n\nI would like to inquire about the following stainless steel products:\n\n";

    items.forEach((item, index) => {
      const p = getProduct(item.id);
      const meta = p ? productMetaLine(p) : "";
      text += `${index + 1}. ${item.name}\n`;
      text += `   Category: ${item.category}\n`;
      if(item.sku) text += `   SKU: ${item.sku}\n`;
      if(meta) text += `   Specification: ${meta}\n`;
      text += `   Inquiry Quantity: ${item.quantity}\n\n`;
    });

    text += "Please contact me with availability, technical confirmation, packing details, lead time and logistics options.\n\nThank you.";
    return text;
  }

  function renderPreview(items){
    if(!items.length){
      preview.style.display = "none";
      preview.innerHTML = "";
      return;
    }

    preview.style.display = "block";

    const shown = items.slice(0, 3);
    const hidden = items.length - shown.length;

    preview.innerHTML = `
      <h4>Selected products (${items.length})</h4>
      ${shown.map(item => {
        const p = getProduct(item.id);
        const meta = p ? productMetaLine(p) : "";
        return `
          <div class="sp-item">
            <div class="sp-img">
              <img src="${item.image}" alt="${escapeHtml(item.name)}">
            </div>
            <div>
              <h5>${escapeHtml(item.name)}</h5>
              <div class="meta">${escapeHtml(item.category)}${meta ? " · " + escapeHtml(meta) : ""}</div>
            </div>
            <div class="qty-px">×${item.quantity}</div>
          </div>
        `;
      }).join("")}
      ${hidden > 0 ? `<div class="sp-more">+${hidden} more · <a href="cart.html">View all / Back to cart</a></div>` : ""}
    `;
  }

  function applyType(){
    const isAsk = typeAsk.checked;

    typeAsk.closest("label")?.classList.toggle("checked", isAsk);
    typeGen.closest("label")?.classList.toggle("checked", !isAsk);

    if(isAsk){
      const items = buildSelected();
      renderPreview(items);
      if(!message.dataset.userEdited){
        message.value = autoFillMessage(items);
      }
    } else {
      preview.style.display = "none";
      preview.innerHTML = "";
      if(!message.dataset.userEdited) message.value = "";
    }
  }

  message.addEventListener("input", () => {
    message.dataset.userEdited = "1";
  });

  typeAsk.addEventListener("change", applyType);
  typeGen.addEventListener("change", applyType);

  if(source === "cart" || productParam){
    typeAsk.checked = true;
  } else {
    typeGen.checked = true;
  }

  applyType();

  form.addEventListener("submit", e => {
    e.preventDefault();

    if(success){
      success.classList.add("show");
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const wasAsk = typeAsk.checked;
    const fromCart = !productParam;

    if(wasAsk && fromCart){
      clearCart();
    }

    form.reset();
    delete message.dataset.userEdited;

    typeGen.checked = true;
    applyType();

    if(success){
      setTimeout(() => success.classList.remove("show"), 6000);
    }
  });
}

/* ---------- FAQ accordion ---------- */
function initFAQ(){
  $$(".faq-item").forEach(item => {
    const question = item.querySelector(".faq-q");
    if(!question) return;

    question.addEventListener("click", () => {
      const open = item.classList.contains("open");
      $$(".faq-item").forEach(x => x.classList.remove("open"));
      if(!open) item.classList.add("open");
    });
  });
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  initHeaderScroll();
  updateBadge();
  initCookie();
  renderProducts();
  renderProductDetail();
  renderCart();
  initContact();
  initFAQ();
  initReveal();
});

window.VK = {
  addToCart,
  clearCart,
  getCart,
  getNormalizedCart
};

})();
