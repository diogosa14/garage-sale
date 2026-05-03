/* ============================================
   GARAGE SALE — Catalog Logic
   ============================================ */

(function () {
  "use strict";

  // State
  let allProducts = [];
  let filteredProducts = [];
  let activeCategory = "todos";
  let searchQuery = "";
  let sortBy = "featured";

  // DOM
  const grid = document.getElementById("productGrid");
  const categoriesNav = document.getElementById("categoriesNav");
  const resultsInfo = document.getElementById("resultsInfo");
  const sortSelect = document.getElementById("sortSelect");
  const searchInput = document.getElementById("searchInput");
  const searchInputMobile = document.getElementById("searchInputMobile");
  const modalOverlay = document.getElementById("modalOverlay");
  const demoBanner = document.getElementById("demoBanner");
  const header = document.getElementById("header");
  const mobileSearchToggle = document.getElementById("mobileSearchToggle");
  const searchMobile = document.getElementById("searchMobile");

  // Newsletter DOM
  const newsForm = document.getElementById('newsForm');
  const newsBtn = document.getElementById('newsBtn');
  const newsMessage = document.getElementById('newsMessage');

  // ========== INIT ==========
  async function init() {
    buildCategoryNav();
    bindEvents();
    bindNewsletter();
    await loadProducts();
    applyFilters();
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
    categoriesNav.innerHTML = CATEGORIES.map(cat =>
      `<button class="cat-btn relative px-4 py-3.5 text-sm font-medium text-gray-500 whitespace-nowrap transition-colors duration-300 hover:text-gray-900${cat.id === 'todos' ? ' active' : ''}" data-cat="${cat.id}">
        ${cat.name}<span class="cat-count inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 ml-1.5 bg-primary-50 text-primary text-[0.65rem] font-bold rounded-full" data-count-cat="${cat.id}">0</span>
      </button>`
    ).join("");
  }

  function updateCategoryCounts() {
    const counts = {};
    const available = allProducts.filter(p => p.available !== false);
    counts["todos"] = available.length;
    CATEGORIES.forEach(c => {
      if (c.id !== "todos") counts[c.id] = available.filter(p => p.category === c.id).length;
    });
    CATEGORIES.forEach(c => {
      const el = document.querySelector(`[data-count-cat="${c.id}"]`);
      if (el) el.textContent = counts[c.id] || 0;
    });
  }

  // ========== FILTERS & SORT ==========
  function applyFilters() {
    let products = [...allProducts].filter(p => p.available !== false);

    // Category filter
    if (activeCategory !== "todos") {
      products = products.filter(p => p.category === activeCategory);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (sortBy) {
      case "featured":
        products.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
      case "recent":
        products.sort((a, b) => {
          const da = a.createdAt?.seconds || 0;
          const db2 = b.createdAt?.seconds || 0;
          return db2 - da;
        });
        break;
      case "price-asc":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        products.sort((a, b) => b.price - a.price);
        break;
      case "name":
        products.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
        break;
    }

    filteredProducts = products;
    updateCategoryCounts();
    render();
  }

  // ========== RENDER ==========
  function render() {
    resultsInfo.innerHTML = `<strong class="text-gray-900 font-semibold">${filteredProducts.length}</strong> produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`;

    if (filteredProducts.length === 0) {
      grid.innerHTML = `
        <div class="text-center py-20 px-6 col-span-full">
          <div class="text-5xl mb-4 opacity-50">🔍</div>
          <div class="text-lg font-semibold text-gray-700 mb-1.5">Nenhum produto encontrado</div>
          <div class="text-sm text-gray-400">Tente buscar por outro termo ou selecione outra categoria</div>
        </div>`;
      return;
    }

    grid.innerHTML = filteredProducts.map((p, i) => {
      const catLabel = CATEGORIES.find(c => c.id === p.category)?.name || p.category;
      const desc = p.description ? p.description.substring(0, 80) + (p.description.length > 80 ? '…' : '') : '';
      return `
        <article class="product-card group bg-white rounded-2xl overflow-hidden shadow-sm cursor-pointer opacity-0 animate-card-in transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" data-id="${p.id}" style="animation-delay:${Math.min(i * 0.06, 0.5)}s">
          <div class="relative w-full" style="padding-top:90%">
            <img src="${p.imageUrl}" alt="${p.name}" loading="lazy"
              class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22><rect fill=%22%23f0dce3%22 width=%22400%22 height=%22400%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%233f1023%22 font-size=%2240%22 text-anchor=%22middle%22 dy=%22.3em%22>📷</text></svg>'">
            ${p.featured ? '<span class="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-[0.7rem] font-semibold rounded-lg uppercase tracking-wide">Destaque</span>' : ''}
          </div>
          <div class="p-4 pb-5 max-md:p-3 max-md:pb-4">
            <div class="text-[0.72rem] font-semibold text-primary-lighter uppercase tracking-widest mb-1.5">${catLabel}</div>
            <h3 class="font-display text-[1.05rem] font-semibold text-gray-900 mb-1 leading-snug max-md:text-sm">${p.name}</h3>
            ${desc ? `<p class="text-xs text-gray-400 mb-2 line-clamp-2 leading-relaxed">${desc}</p>` : ''}
            <div class="text-lg font-bold text-primary max-md:text-base"><span class="text-sm font-normal">R$</span> ${formatPrice(p.price)}</div>
          </div>
        </article>`;
    }).join("");
  }

  // ========== MODAL ==========
  function openModal(product) {
    const catLabel = CATEGORIES.find(c => c.id === product.category)?.name || product.category;
    document.getElementById("modalImg").src = product.imageUrl;
    document.getElementById("modalImg").alt = product.name;
    document.getElementById("modalCategory").textContent = catLabel;
    document.getElementById("modalName").textContent = product.name;
    document.getElementById("modalPrice").innerHTML = `<span class="text-base font-normal">R$</span> ${formatPrice(product.price)}`;
    document.getElementById("modalDesc").textContent = product.description || "";
    document.getElementById("modalWhatsapp").href = generateWhatsAppLink(product);
    modalOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modalOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // ========== EVENTS ==========
  function bindEvents() {
    // Category clicks
    categoriesNav.addEventListener("click", e => {
      const btn = e.target.closest(".cat-btn");
      if (!btn) return;
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCategory = btn.dataset.cat;
      applyFilters();
    });

    // Sort
    sortSelect.addEventListener("change", () => {
      sortBy = sortSelect.value;
      applyFilters();
    });

    // Search (desktop)
    let searchTimer;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        searchQuery = searchInput.value.trim();
        if (searchInputMobile) searchInputMobile.value = searchQuery;
        applyFilters();
      }, 250);
    });

    // Search (mobile)
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

    // Mobile search toggle
    if (mobileSearchToggle) {
      mobileSearchToggle.addEventListener("click", () => {
        const vis = searchMobile.style.display !== "block";
        searchMobile.style.display = vis ? "block" : "none";
        if (vis) searchInputMobile.focus();
      });
    }

    // Product card click → modal
    grid.addEventListener("click", e => {
      const card = e.target.closest(".product-card");
      if (!card) return;
      const product = filteredProducts.find(p => p.id === card.dataset.id);
      if (product) openModal(product);
    });

    // Close modal
    document.getElementById("modalClose").addEventListener("click", closeModal);
    modalOverlay.addEventListener("click", e => {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape") closeModal();
    });

    // Header scroll shadow
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  // ========== NEWSLETTER ==========
  function bindNewsletter() {
    if (!newsForm) return;

    newsForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!IS_FIREBASE_CONFIGURED) {
        showNewsMessage("Configure o Firebase para se inscrever.", "error");
        return;
      }

      const emailInput = document.getElementById('newsEmail');
      const email = emailInput.value.trim();

      if (email) {
        newsBtn.disabled = true;
        newsBtn.textContent = "Enviando...";

        try {
          const bancoDeDados = firebase.firestore();
          await bancoDeDados.collection("subscribers").add({
            email: email,
            subscribedAt: firebase.firestore.FieldValue.serverTimestamp()
          });

          showNewsMessage("Inscrição confirmada! 🎉", "success");
          emailInput.value = '';
        } catch (err) {
          console.error("Erro ao salvar email: ", err);
          showNewsMessage("Erro ao tentar se inscrever. Tente novamente.", "error");
        } finally {
          newsBtn.disabled = false;
          newsBtn.textContent = "Inscrever";
        }
      }
    });
  }

  function showNewsMessage(text, type) {
    newsMessage.textContent = text;
    newsMessage.style.display = "block";
    newsMessage.style.color = type === "success" ? "#27ae60" : "#c0392b";
    setTimeout(() => {
      newsMessage.style.display = "none";
    }, 4000);
  }

  // ========== START ==========
  document.addEventListener("DOMContentLoaded", init);
})();