/* ============================================
   JA GARAGE SALE — Catalog + Cart Logic v2
   ============================================ */
(function () {
  "use strict";

  // ========== STATE ==========
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = "todos";
  let searchQuery = "";
  let sortBy = "featured";
  let cart = loadCart();

  // ========== DOM ==========
  const grid               = document.getElementById("productGrid");
  const categoriesNav      = document.getElementById("categoriesNav");
  const resultsInfo        = document.getElementById("resultsInfo");
  const sortSelect         = document.getElementById("sortSelect");
  const searchInput        = document.getElementById("searchInput");
  const searchInputMobile  = document.getElementById("searchInputMobile");
  const modalOverlay       = document.getElementById("modalOverlay");
  const demoBanner         = document.getElementById("demoBanner");
  const header             = document.getElementById("header");
  const mobileSearchToggle = document.getElementById("mobileSearchToggle");
  const searchMobile       = document.getElementById("searchMobile");
  const heroSection        = document.getElementById("heroSection");
  const catalogSection     = document.getElementById("catalogSection");
  const cartDrawer         = document.getElementById("cartDrawer");
  const cartBackdrop       = document.getElementById("cartBackdrop");
  const cartItemsList      = document.getElementById("cartItemsList");
  const cartTotal          = document.getElementById("cartTotal");
  const cartCount          = document.getElementById("cartCount");
  const cartCountMobile    = document.getElementById("cartCountMobile");
  const newsForm           = document.getElementById("newsForm");
  const newsBtn            = document.getElementById("newsBtn");
  const newsMessage        = document.getElementById("newsMessage");

  // ========== INIT ==========
  async function init() {
    buildCategoryNav();
    bindEvents();
    bindCartEvents();
    bindNewsletter();
    await loadProducts();
    applyFilters();
    renderCart();
  }

  // ========== NORMALIZE ==========
  function normalize(str) {
    return (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  // ========== GET THUMBNAIL (multi-photo fallback) ==========
  function getThumb(p) {
    return (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || "");
  }

  const CONDITION_LABELS = {
    impecavel:         "Impecável",
    excelente:         "Excelente",
    "marcas-do-tempo": "Marcas do Tempo",
    "a-restaurar":     "A Restaurar",
  };

  // ========== HERO VISIBILITY ==========
  function updateHeroVisibility() {
    if (!heroSection) return;
    const showHero = activeCategory === "todos" && searchQuery === "";
    heroSection.classList.toggle("hidden", !showHero);

    if (!showHero && catalogSection) {
      // Only scroll if the hero section is currently in the viewport
      const heroRect = heroSection.getBoundingClientRect();
      const heroVisible = heroRect.top < window.innerHeight && heroRect.bottom > 0;
      if (heroVisible) {
        setTimeout(() => catalogSection.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      }
    }
  }

  // ========== LOAD PRODUCTS ==========
  async function loadProducts() {
    if (IS_FIREBASE_CONFIGURED) {
      try {
        const db = firebase.firestore();
        const snap = await db.collection("products").where("available", "==", true).get();
        allProducts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (e) {
        console.error("Firebase error:", e);
        allProducts = DEMO_PRODUCTS;
        demoBanner.style.display = "block";
      }
    } else {
      allProducts = DEMO_PRODUCTS;
      demoBanner.style.display = "block";
    }
  }

  // ========== CATEGORY NAV ==========
  function buildCategoryNav() {
    categoriesNav.innerHTML = CATEGORIES.map(cat => {
      const active = cat.id === "todos";
      return `<button class="cat-btn relative px-4 py-2 my-2 text-sm font-semibold whitespace-nowrap transition-all duration-200 rounded-full mx-0.5
        ${active ? "bg-primary text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}" data-cat="${cat.id}">
        ${cat.name}<span class="cat-count inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 ml-1.5 text-[0.65rem] font-bold rounded-full
        ${active ? "bg-white/25 text-white" : "bg-primary-50 text-primary"}" data-count-cat="${cat.id}">0</span>
      </button>`;
    }).join("");
  }

  function updateCategoryCounts() {
    const available = allProducts.filter(p => p.available !== false);
    const counts = { todos: available.length };
    CATEGORIES.forEach(c => { if (c.id !== "todos") counts[c.id] = available.filter(p => p.category === c.id).length; });
    CATEGORIES.forEach(c => {
      const el = document.querySelector(`[data-count-cat="${c.id}"]`);
      if (el) el.textContent = counts[c.id] || 0;
    });
  }

  function setActiveCategory(catId) {
    activeCategory = catId;
    document.querySelectorAll(".cat-btn").forEach(btn => {
      const active = btn.dataset.cat === catId;
      btn.className = btn.className
        .replace(/bg-primary|text-white|shadow-sm|text-gray-500|hover:text-gray-900|hover:bg-gray-50/g, "").trim();
      if (active) btn.classList.add("bg-primary", "text-white", "shadow-sm");
      else btn.classList.add("text-gray-500", "hover:text-gray-900", "hover:bg-gray-50");
      const badge = btn.querySelector(".cat-count");
      if (!badge) return;
      if (active) { badge.classList.remove("bg-primary-50", "text-primary"); badge.classList.add("bg-white/25", "text-white"); }
      else { badge.classList.remove("bg-white/25", "text-white"); badge.classList.add("bg-primary-50", "text-primary"); }
    });
  }

  // ========== FILTERS ==========
  function applyFilters() {
    let products = [...allProducts].filter(p => p.available !== false);
    if (activeCategory !== "todos") products = products.filter(p => p.category === activeCategory);
    if (searchQuery) {
      const q = normalize(searchQuery);
      products = products.filter(p =>
        normalize(p.name).includes(q) ||
        normalize(p.category).includes(q) ||
        normalize(p.description).includes(q)
      );
    }
    switch (sortBy) {
      case "featured":   products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
      case "recent":     products.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); break;
      case "price-asc":  products.sort((a, b) => a.price - b.price); break;
      case "price-desc": products.sort((a, b) => b.price - a.price); break;
      case "name":       products.sort((a, b) => a.name.localeCompare(b.name, "pt-BR")); break;
    }
    filteredProducts = products;
    updateCategoryCounts();
    updateHeroVisibility();
    render();
  }

  // ========== RENDER GRID ==========
  function render() {
    resultsInfo.innerHTML = `<strong class="text-gray-900 font-semibold">${filteredProducts.length}</strong> produto${filteredProducts.length !== 1 ? "s" : ""} encontrado${filteredProducts.length !== 1 ? "s" : ""}`;

    if (filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-24 px-6 col-span-full">
          <div class="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-6">
            <svg class="w-9 h-9 text-primary-lighter" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z"/>
            </svg>
          </div>
          <p class="font-display text-xl font-semibold text-gray-800 mb-2">Peça não encontrada</p>
          <p class="text-sm text-gray-400 max-w-[260px] mx-auto leading-relaxed">Tente outro termo ou selecione uma categoria diferente</p>
        </div>`;
      return;
    }

    grid.innerHTML = filteredProducts.map((p, i) => {
      const catLabel = CATEGORIES.find(c => c.id === p.category)?.name || p.category;
      const desc = p.description ? p.description.substring(0, 80) + (p.description.length > 80 ? "..." : "") : "";
      const inCart   = cart.some(c => c.id === p.id);
      const thumb    = getThumb(p);
      const hasMulti = p.images && p.images.length > 1;
      return `
        <article class="product-card group bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer opacity-0 animate-card-in transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          data-id="${p.id}" style="animation-delay:${Math.min(i * 0.06, 0.5)}s">
          <div class="relative w-full" style="padding-top:90%">
            <img src="${thumb}" alt="${p.name}" loading="lazy"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23f7d6e0%22 width=%22400%22 height=%22400%22/></svg>'">
            ${p.featured ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-[0.7rem] font-semibold rounded-lg uppercase tracking-wide">Destaque</span>' : ""}
            ${hasMulti ? `<span class="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-black/40 text-white text-[0.65rem] font-semibold rounded-lg backdrop-blur-sm">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909"/></svg>
              ${p.images.length}
            </span>` : ""}
            <button class="add-to-cart-btn absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center rounded-full shadow-md transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0
              ${inCart ? "bg-primary text-white" : "bg-white text-primary hover:bg-primary hover:text-white"}"
              data-id="${p.id}" title="${inCart ? "No carrinho" : "Adicionar ao carrinho"}">
              ${inCart
                ? `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`
                : `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>`
              }
            </button>
          </div>
          <div class="p-4 pb-5 max-md:p-3 max-md:pb-4">
            <div class="text-[0.72rem] font-semibold text-primary-lighter uppercase tracking-widest mb-1.5">${catLabel}</div>
            <h3 class="font-display text-[1.05rem] font-semibold text-gray-900 mb-1 leading-snug max-md:text-sm">${p.name}</h3>
            ${desc ? `<p class="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">${desc}</p>` : ""}
            <div class="text-lg font-bold text-primary max-md:text-base">
              ${p.discountPct > 0 && p.originalPrice
                ? `<span class="text-xs font-normal line-through text-gray-300 mr-1">R$ ${formatPrice(p.originalPrice)}</span>
                   <span class="text-sm font-normal">R$</span> ${formatPrice(p.price)}
                   <span class="ml-1 text-[0.65rem] font-bold text-white bg-primary px-1.5 py-0.5 rounded-md">-${p.discountPct}%</span>`
                : `<span class="text-sm font-normal">R$</span> ${formatPrice(p.price)}`
              }
            </div>
          </div>
        </article>`;
    }).join("");

  }

  // ========== MODAL ==========
  let _modalImages = [];
  let _modalIdx = 0;

  function openModal(product) {
    const catLabel = CATEGORIES.find(c => c.id === product.category)?.name || product.category;

    // Build images array with fallback
    _modalImages = (product.images && product.images.length > 0)
      ? product.images
      : (product.imageUrl ? [product.imageUrl] : []);
    _modalIdx = 0;

    // Carousel
    renderModalCarousel();

    // Text fields
    document.getElementById("modalCategory").textContent  = catLabel;
    document.getElementById("modalName").textContent      = product.name;

    // Price display with optional discount
    const priceEl = document.getElementById("modalPrice");
    if (product.discountPct > 0 && product.originalPrice) {
      priceEl.innerHTML = `
        <span class="text-sm font-normal line-through text-gray-300 mr-2">R$ ${formatPrice(product.originalPrice)}</span>
        <span class="text-2xl font-bold text-primary"><span class="text-base font-normal">R$</span> ${formatPrice(product.price)}</span>
        <span class="ml-2 text-sm font-bold text-white bg-primary px-2.5 py-1 rounded-lg">-${product.discountPct}%</span>`;
    } else {
      priceEl.innerHTML = `<span class="text-base font-normal">R$</span> ${formatPrice(product.price)}`;
    }

    document.getElementById("modalDesc").textContent      = product.description || "";
    document.getElementById("modalWhatsapp").href         = generateWhatsAppLink(product);

    // Technical data
    const condLabel = CONDITION_LABELS[product.condition] || product.condition || null;
    const condEl    = document.getElementById("modalCondition");
    const dimEl     = document.getElementById("modalDimensions");
    const storyEl   = document.getElementById("modalStory");
    const techBlock = document.getElementById("modalTechData");

    if (condEl)  condEl.textContent  = condLabel || "";
    if (dimEl)   dimEl.textContent   = product.dimensions || "";
    if (storyEl) storyEl.textContent = product.curationStory || "";
    if (techBlock) {
      const hasData = condLabel || product.dimensions || product.curationStory;
      techBlock.classList.toggle("hidden", !hasData);
    }

    // Cart button
    const addBtn = document.getElementById("modalAddToCart");
    if (addBtn) { addBtn.dataset.id = product.id; updateModalCartBtn(product.id); }

    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function renderModalCarousel() {
    const container = document.getElementById("modalCarousel");
    if (!container) return;

    if (_modalImages.length === 0) {
      container.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-50"><svg class="w-12 h-12 text-gray-200" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24"><path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909"/></svg></div>';
      return;
    }

    const multiNav = _modalImages.length > 1 ? `
      <button id="modalPrev" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-all z-10">
        <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
      </button>
      <button id="modalNext" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-all z-10">
        <svg class="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
      </button>
      <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        ${_modalImages.map((_, i) => `<button class="modal-dot w-1.5 h-1.5 rounded-full transition-all ${i === 0 ? "bg-white scale-125" : "bg-white/50"}" data-idx="${i}"></button>`).join("")}
      </div>` : "";

    container.innerHTML = `
      <div class="relative w-full h-full">
        <img id="modalImg" src="${_modalImages[0]}" alt="" class="w-full h-full object-cover">
        ${multiNav}
      </div>`;

    if (_modalImages.length > 1) {
      document.getElementById("modalPrev").addEventListener("click", () => navigateModal(-1));
      document.getElementById("modalNext").addEventListener("click", () => navigateModal(+1));
      container.querySelectorAll(".modal-dot").forEach(btn => {
        btn.addEventListener("click", () => { _modalIdx = parseInt(btn.dataset.idx); updateModalImage(); });
      });
    }
  }

  function navigateModal(dir) {
    _modalIdx = (_modalIdx + dir + _modalImages.length) % _modalImages.length;
    updateModalImage();
  }

  function updateModalImage() {
    const img = document.getElementById("modalImg");
    if (img) img.src = _modalImages[_modalIdx];
    document.querySelectorAll(".modal-dot").forEach((btn, i) => {
      btn.classList.toggle("bg-white", i === _modalIdx);
      btn.classList.toggle("scale-125", i === _modalIdx);
      btn.classList.toggle("bg-white/50", i !== _modalIdx);
    });
  }

  function updateModalCartBtn(productId) {
    const addBtn = document.getElementById("modalAddToCart");
    if (!addBtn) return;
    const inCart = cart.some(c => c.id === productId);
    addBtn.textContent = inCart ? "✓ No carrinho" : "🛒 Adicionar ao carrinho";
    addBtn.className = `flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-xl text-base font-semibold transition-all duration-300 mb-3
      ${inCart ? "bg-gray-100 text-gray-500" : "bg-primary text-white hover:bg-primary-light hover:-translate-y-0.5 hover:shadow-lg"}`;
  }

  function closeModal() { modalOverlay.classList.remove("active"); document.body.style.overflow = ""; }

  // ========== CART LOGIC ==========
  function loadCart() {
    try { return JSON.parse(localStorage.getItem("ja_garage_cart") || "[]"); } catch { return []; }
  }

  function saveCart() { localStorage.setItem("ja_garage_cart", JSON.stringify(cart)); }

  function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(c => c.id === productId);
    if (existing) { existing.qty = (existing.qty || 1) + 1; }
    else { cart.push({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, qty: 1 }); }
    saveCart(); renderCart(); render(); updateModalCartBtn(productId); flashCartBadge();
  }

  function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    saveCart(); renderCart(); render(); updateModalCartBtn(productId);
  }

  function changeQty(productId, delta) {
    const item = cart.find(c => c.id === productId);
    if (!item) return;
    item.qty = Math.max(1, (item.qty || 1) + delta);
    saveCart(); renderCart();
  }

  function flashCartBadge() {
    [cartCount, cartCountMobile].forEach(el => {
      if (!el) return;
      el.classList.add("scale-125");
      setTimeout(() => el.classList.remove("scale-125"), 350);
    });
  }

  function renderCart() {
    const total = cart.reduce((s, c) => s + c.price * (c.qty || 1), 0);
    const count = cart.reduce((s, c) => s + (c.qty || 1), 0);
    [cartCount, cartCountMobile].forEach(el => {
      if (!el) return;
      el.textContent = count;
      el.classList.toggle("hidden", count === 0);
    });
    if (cartTotal) cartTotal.textContent = `R$ ${formatPrice(total)}`;
    if (!cartItemsList) return;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-16 text-center px-6">
          <div class="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-primary-lighter" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/>
            </svg>
          </div>
          <p class="font-display text-lg font-semibold text-gray-700 mb-1">Carrinho vazio</p>
          <p class="text-sm text-gray-400">Adicione peças do catálogo</p>
        </div>`;
      return;
    }

    cartItemsList.innerHTML = cart.map(item => `
      <div class="flex gap-3 items-start py-4 border-b border-gray-50 last:border-0" data-cart-item="${item.id}">
        <img src="${item.imageUrl}" alt="${item.name}"
          class="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23f7d6e0%22 width=%2264%22 height=%2264%22/></svg>'">
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-sm text-gray-900 leading-snug truncate">${item.name}</p>
          <p class="text-primary font-bold text-sm mt-0.5">R$ ${formatPrice(item.price)}</p>
          <div class="flex items-center gap-2 mt-2">
            <button class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors text-sm font-bold cart-qty-minus" data-id="${item.id}">−</button>
            <span class="text-sm font-semibold w-4 text-center">${item.qty || 1}</span>
            <button class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-primary hover:text-white transition-colors text-sm font-bold cart-qty-plus" data-id="${item.id}">+</button>
          </div>
        </div>
        <button class="cart-remove-btn flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors" data-id="${item.id}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>`).join("");
  }

  function openCartDrawer() {
    cartDrawer.classList.remove("translate-x-full");
    cartBackdrop.classList.remove("opacity-0", "pointer-events-none");
    document.body.style.overflow = "hidden";
  }

  function closeCartDrawer() {
    cartDrawer.classList.add("translate-x-full");
    cartBackdrop.classList.add("opacity-0", "pointer-events-none");
    document.body.style.overflow = "";
  }

  function buildCheckoutMessage() {
    const lines = cart.map(c => `• ${c.name} (x${c.qty || 1}) — R$ ${formatPrice(c.price * (c.qty || 1))}`);
    const total = cart.reduce((s, c) => s + c.price * (c.qty || 1), 0);
    return `Olá, Janice! Tenho interesse nas seguintes peças do JA Garage Sale:\n\n${lines.join("\n")}\n\n*Total: R$ ${formatPrice(total)}*\n\nPoderia me dar mais informações?`;
  }

  // ========== BIND CART EVENTS ==========
  function bindCartEvents() {
    document.getElementById("cartOpenBtn")?.addEventListener("click", openCartDrawer);
    document.getElementById("cartOpenBtnMobile")?.addEventListener("click", openCartDrawer);
    document.getElementById("cartCloseBtn")?.addEventListener("click", closeCartDrawer);
    cartBackdrop?.addEventListener("click", closeCartDrawer);

    cartItemsList?.addEventListener("click", e => {
      const r = e.target.closest(".cart-remove-btn");
      const m = e.target.closest(".cart-qty-minus");
      const p = e.target.closest(".cart-qty-plus");
      if (r) removeFromCart(r.dataset.id);
      if (m) changeQty(m.dataset.id, -1);
      if (p) changeQty(p.dataset.id, +1);
    });

    document.getElementById("cartCheckoutBtn")?.addEventListener("click", () => {
      if (cart.length === 0) return;
      window.open(`https://wa.me/5531992428170?text=${encodeURIComponent(buildCheckoutMessage())}`, "_blank");
    });

    grid.addEventListener("click", e => {
      const addBtn = e.target.closest(".add-to-cart-btn");
      if (addBtn) { e.stopPropagation(); addToCart(addBtn.dataset.id); return; }
      const card = e.target.closest(".product-card");
      if (card) { const product = filteredProducts.find(p => p.id === card.dataset.id); if (product) openModal(product); }
    });

    document.getElementById("modalAddToCart")?.addEventListener("click", e => {
      const id = e.currentTarget.dataset.id;
      if (!cart.some(c => c.id === id)) addToCart(id);
    });
  }

  // ========== BIND EVENTS ==========
  function bindEvents() {
    categoriesNav.addEventListener("click", e => {
      const btn = e.target.closest(".cat-btn");
      if (!btn) return;
      setActiveCategory(btn.dataset.cat);
      applyFilters();
    });

    sortSelect.addEventListener("change", () => { sortBy = sortSelect.value; applyFilters(); });

    let searchTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        if (searchInputMobile) searchInputMobile.value = searchQuery;
        applyFilters();
      }, 250);
    });

    if (searchInputMobile) {
      searchInputMobile.addEventListener("input", () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          searchQuery = searchInputMobile.value.trim();
          searchInput.value = searchQuery;
          applyFilters();
        }, 250);
      });
    }

    mobileSearchToggle?.addEventListener("click", () => {
      const vis = searchMobile.style.display !== "block";
      searchMobile.style.display = vis ? "block" : "none";
      if (vis) searchInputMobile?.focus();
    });

    document.getElementById("modalClose").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeCartDrawer(); } });
    window.addEventListener("scroll", () => { header.classList.toggle("scrolled", window.scrollY > 10); }, { passive: true });
  }

  // ========== NEWSLETTER ==========
  function bindNewsletter() {
    if (!newsForm) return;
    newsForm.addEventListener("submit", async e => {
      e.preventDefault();
      if (!IS_FIREBASE_CONFIGURED) { showNewsMessage("Configure o Firebase para se inscrever.", "error"); return; }
      const emailInput = document.getElementById("newsEmail");
      const email = emailInput.value.trim();
      if (!email) return;
      newsBtn.disabled = true; newsBtn.textContent = "Enviando...";
      try {
        await firebase.firestore().collection("subscribers").add({ email, subscribedAt: firebase.firestore.FieldValue.serverTimestamp() });
        showNewsMessage("Inscrição confirmada! 🎉", "success");
        emailInput.value = "";
      } catch (err) {
        console.error(err); showNewsMessage("Erro ao tentar se inscrever. Tente novamente.", "error");
      } finally { newsBtn.disabled = false; newsBtn.textContent = "Inscrever"; }
    });
  }

  function showNewsMessage(text, type) {
    newsMessage.textContent = text; newsMessage.style.display = "block";
    newsMessage.style.color = type === "success" ? "#27ae60" : "#c0392b";
    setTimeout(() => { newsMessage.style.display = "none"; }, 4000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();