/* ============================================
   JA GARAGE SALE — Admin Panel v2
   Multi-photo, new fields, luxury UI
   ============================================ */
(function () {
  "use strict";

  // DOM
  const loginScreen    = document.getElementById("loginScreen");
  const adminApp       = document.getElementById("adminApp");
  const loginForm      = document.getElementById("loginForm");
  const loginError     = document.getElementById("loginError");
  const loginBtn       = document.getElementById("loginBtn");
  const logoutBtn      = document.getElementById("logoutBtn");
  const setupNotice    = document.getElementById("setupNotice");
  const productForm    = document.getElementById("productForm");
  const formTitle      = document.getElementById("formTitle");
  const editIdField    = document.getElementById("editId");
  const submitBtn      = document.getElementById("submitBtn");
  const cancelBtn      = document.getElementById("cancelBtn");
  const productList    = document.getElementById("productList");
  const uploadArea     = document.getElementById("uploadArea");
  const fileInput      = document.getElementById("pFile");
  const photoGrid      = document.getElementById("photoPreviewGrid");
  const photoCount     = document.getElementById("photoCount");
  const toast          = document.getElementById("toast");

  let db, auth, storage;
  let products = [];

  // Multi-photo state: { file?: File, url: string (blob or remote), remote?: boolean }[]
  let photoSlots = [];

  // ========== INIT ==========
  function init() {
    if (!IS_FIREBASE_CONFIGURED) {
      loginScreen.style.display = "none";
      adminApp.style.display = "block";
      setupNotice.style.display = "flex";
      renderDemoList();
      updateStats(DEMO_PRODUCTS);
      return;
    }

    db      = firebase.firestore();
    auth    = firebase.auth();
    storage = firebase.storage();

    auth.onAuthStateChanged(user => {
      if (user) { showAdmin(); loadProducts(); loadSubscribers(); }
      else       { showLogin(); }
    });

    bindEvents();
  }

  // ========== AUTH ==========
  function showLogin() { loginScreen.style.display = "flex"; adminApp.style.display = "none"; }
  function showAdmin()  { loginScreen.style.display = "none"; adminApp.style.display = "block"; }

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email    = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    loginBtn.disabled = true; loginBtn.textContent = "Entrando...";
    loginError.classList.add("hidden");
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      loginError.textContent = getAuthError(err.code);
      loginError.classList.remove("hidden");
    } finally {
      loginBtn.disabled = false; loginBtn.textContent = "Entrar";
    }
  });

  logoutBtn.addEventListener("click", () => { if (auth) auth.signOut(); });

  function getAuthError(code) {
    return ({
      "auth/user-not-found":    "Usuário não encontrado.",
      "auth/wrong-password":    "Senha incorreta.",
      "auth/invalid-email":     "Email inválido.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
      "auth/invalid-credential":"Email ou senha incorretos.",
    })[code] || "Erro ao fazer login. Tente novamente.";
  }

  // ========== LOAD PRODUCTS ==========
  async function loadProducts() {
    try {
      const snap = await db.collection("products").orderBy("createdAt", "desc").get();
      products = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderList();
      updateStats(products);
    } catch (err) {
      console.error(err);
      showToast("Erro ao carregar produtos", "error");
    }
  }

  // ========== RENDER LIST ==========
  const CONDITION_LABELS = {
    impecavel:       "Impecável",
    excelente:       "Excelente",
    "marcas-do-tempo": "Marcas do Tempo",
    "a-restaurar":   "A Restaurar",
  };

  function getThumb(p) {
    return (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || "");
  }

  function renderList() {
    if (products.length === 0) {
      productList.innerHTML = '<p class="text-center text-gray-400 py-10 text-sm">Nenhuma peça cadastrada ainda.</p>';
      return;
    }
    productList.innerHTML = products.map(p => {
      const catObj   = CATEGORIES.find(c => c.id === p.category);
      const catName  = catObj ? catObj.name : p.category;
      const thumb    = getThumb(p);
      const photoNum = p.images ? p.images.length : (p.imageUrl ? 1 : 0);
      const cond     = CONDITION_LABELS[p.condition] || p.condition || "";
      const available = p.available !== false;

      return `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex items-center gap-4 transition-all hover:shadow-md max-md:flex-wrap" data-id="${p.id}">
          <div class="relative flex-shrink-0">
            <img class="w-16 h-16 rounded-xl object-cover bg-gray-100" src="${thumb}"
              alt="${p.name}"
              onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 64 64%22><rect fill=%22%23f7d6e0%22 width=%2264%22 height=%2264%22 rx=%228%22/></svg>'">
            ${photoNum > 1 ? `<span class="absolute -bottom-1 -right-1 bg-primary text-white text-[0.55rem] font-bold rounded-full w-5 h-5 flex items-center justify-center">${photoNum}</span>` : ""}
          </div>
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm text-gray-900 truncate">${p.name}</div>
            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
              <span class="text-xs text-gray-400">${catName}</span>
              ${cond ? `<span class="text-[0.65rem] font-semibold px-2 py-0.5 bg-primary-50 text-primary rounded-full">${cond}</span>` : ""}
              ${p.featured ? '<span class="text-[0.65rem] font-semibold px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-full">Destaque</span>' : ""}
              ${!available ? '<span class="text-[0.65rem] font-semibold px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full">Oculto</span>' : ""}
            </div>
          </div>
          <div class="font-bold text-primary text-sm whitespace-nowrap">R$ ${formatPrice(p.price)}</div>
          <div class="flex gap-1.5 flex-shrink-0">
            <!-- Toggle visibility -->
            <button class="w-8 h-8 flex items-center justify-center rounded-lg transition-all ${available ? "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-400 hover:text-white"}"
              title="${available ? "Ocultar" : "Tornar visível"}" onclick="adminToggle('${p.id}')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                ${available
                  ? '<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>'
                  : '<path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>'}
              </svg>
            </button>
            <!-- Edit -->
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-primary-50 text-primary hover:bg-primary hover:text-white transition-all"
              title="Editar" onclick="adminEdit('${p.id}')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"/></svg>
            </button>
            <!-- Delete -->
            <button class="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all"
              title="Excluir" onclick="adminDelete('${p.id}')">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
            </button>
          </div>
        </div>`;
    }).join("");
  }

  function renderDemoList() {
    products = DEMO_PRODUCTS;
    productList.innerHTML = DEMO_PRODUCTS.map(p => {
      const catObj = CATEGORIES.find(c => c.id === p.category);
      return `
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-50 flex items-center gap-4">
          <img class="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0" src="${getThumb(p)}" alt="${p.name}">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${p.name}</div>
            <div class="text-xs text-gray-400 mt-0.5">${catObj ? catObj.name : p.category}</div>
          </div>
          <div class="font-bold text-primary text-sm">R$ ${formatPrice(p.price)}</div>
          <span class="text-xs text-gray-300 font-medium px-2 py-1 bg-gray-50 rounded-lg">Demo</span>
        </div>`;
    }).join("");
  }

  // ========== STATS ==========
  function updateStats(data) {
    document.getElementById("statTotal").textContent      = data.length;
    document.getElementById("statAvailable").textContent  = data.filter(p => p.available !== false).length;
    document.getElementById("statFeatured").textContent   = data.filter(p => p.featured).length;
    document.getElementById("statCategories").textContent = new Set(data.map(p => p.category)).size;
  }

  // ========== PHOTO PREVIEW GRID ==========
  function renderPhotoGrid() {
    if (photoSlots.length === 0) {
      photoGrid.classList.add("hidden");
      photoCount.textContent = "";
      return;
    }
    photoGrid.classList.remove("hidden");
    photoGrid.className = "mt-4 grid grid-cols-4 gap-3 max-md:grid-cols-3";
    photoCount.textContent = `${photoSlots.length} foto${photoSlots.length > 1 ? "s" : ""} — a primeira será a capa`;

    photoGrid.innerHTML = photoSlots.map((slot, idx) => `
      <div class="relative group rounded-xl overflow-hidden aspect-square bg-gray-100">
        ${idx === 0 ? '<div class="absolute top-1.5 left-1.5 z-10 bg-primary text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-md">Capa</div>' : ""}
        <img src="${slot.url}" alt="Foto ${idx + 1}" class="w-full h-full object-cover">
        <button type="button" onclick="removePhoto(${idx})"
          class="absolute top-1 right-1 w-6 h-6 bg-white/90 hover:bg-red-500 hover:text-white text-gray-700 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-sm">
          <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>`).join("");
  }

  window.removePhoto = function(idx) {
    if (photoSlots[idx]?.url?.startsWith("blob:")) URL.revokeObjectURL(photoSlots[idx].url);
    photoSlots.splice(idx, 1);
    renderPhotoGrid();
  };

  // ========== BIND EVENTS ==========
  function bindEvents() {
    productForm.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", resetForm);

    fileInput.addEventListener("change", () => {
      Array.from(fileInput.files).forEach(file => {
        photoSlots.push({ file, url: URL.createObjectURL(file), remote: false });
      });
      fileInput.value = "";
      renderPhotoGrid();
    });

    uploadArea.addEventListener("dragover", e => { e.preventDefault(); uploadArea.classList.add("dragover"); });
    uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
    uploadArea.addEventListener("drop", e => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")).forEach(file => {
        photoSlots.push({ file, url: URL.createObjectURL(file), remote: false });
      });
      renderPhotoGrid();
    });
  }

  // ========== SUBMIT ==========
  async function handleSubmit(e) {
    e.preventDefault();
    if (!IS_FIREBASE_CONFIGURED) { showToast("Configure o Firebase primeiro!", "error"); return; }

    submitBtn.disabled = true;
    submitBtn.querySelector("span") && (submitBtn.lastChild.textContent = " Salvando...");
    submitBtn.textContent = "Salvando...";

    try {
      // Upload new files to Cloudinary sequentially
      const imageUrls = [];
      for (let i = 0; i < photoSlots.length; i++) {
        const slot = photoSlots[i];
        if (slot.remote) {
          imageUrls.push(slot.url);
        } else {
          submitBtn.textContent = `Subindo foto ${i + 1} de ${photoSlots.length}...`;
          const fd = new FormData();
          fd.append("file", slot.file);
          fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
          const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
          const data = await res.json();
          if (!data.secure_url) throw new Error("Falha no upload da imagem " + (i + 1));
          imageUrls.push(data.secure_url);
        }
      }

      submitBtn.textContent = "Salvando dados...";

      const productData = {
        name:          document.getElementById("pName").value.trim(),
        price:         Number(document.getElementById("pPrice").value),
        category:      document.getElementById("pCategory").value,
        condition:     document.getElementById("pCondition").value,
        dimensions:    document.getElementById("pDimensions").value.trim(),
        description:   document.getElementById("pDesc").value.trim(),
        curationStory: document.getElementById("pCurationStory").value.trim(),
        images:        imageUrls,
        // Keep legacy imageUrl for backward compat (first image)
        imageUrl:      imageUrls[0] || "",
        featured:      document.getElementById("pFeatured").checked,
        available:     document.getElementById("pAvailable").checked,
        updatedAt:     firebase.firestore.FieldValue.serverTimestamp(),
      };

      const editId = editIdField.value;
      if (editId) {
        await db.collection("products").doc(editId).update(productData);
        showToast("Peça atualizada com sucesso!", "success");
      } else {
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("products").add(productData);
        showToast("Peça adicionada ao catálogo!", "success");
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Erro: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Salvar Peça";
    }
  }

  // ========== EDIT / DELETE / TOGGLE ==========
  window.adminEdit = function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    editIdField.value = id;
    document.getElementById("pName").value          = p.name;
    document.getElementById("pPrice").value         = p.price;
    document.getElementById("pCategory").value      = p.category;
    document.getElementById("pCondition").value     = p.condition || "";
    document.getElementById("pDimensions").value    = p.dimensions || "";
    document.getElementById("pDesc").value          = p.description || "";
    document.getElementById("pCurationStory").value = p.curationStory || "";
    document.getElementById("pFeatured").checked    = !!p.featured;
    document.getElementById("pAvailable").checked   = p.available !== false;

    // Populate photo slots from existing images
    photoSlots = [];
    const imgs = p.images && p.images.length > 0 ? p.images : (p.imageUrl ? [p.imageUrl] : []);
    imgs.forEach(url => photoSlots.push({ url, remote: true }));
    renderPhotoGrid();

    formTitle.textContent = "Editar Peça";
    cancelBtn.classList.remove("hidden");
    document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
  };

  window.adminDelete = async function(id) {
    const p = products.find(x => x.id === id);
    if (!p || !confirm(`Excluir "${p.name}"?\nEssa ação não pode ser desfeita.`)) return;
    try {
      await db.collection("products").doc(id).delete();
      showToast("Peça excluída!", "success");
      await loadProducts();
    } catch (err) {
      showToast("Erro ao excluir", "error");
    }
  };

  window.adminToggle = async function(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newState = p.available === false;
    try {
      await db.collection("products").doc(id).update({ available: newState });
      showToast(newState ? "Peça visível no catálogo!" : "Peça ocultada do catálogo!", "success");
      await loadProducts();
    } catch (err) {
      showToast("Erro ao alterar visibilidade", "error");
    }
  };

  // ========== NEWSLETTER ==========
  async function loadSubscribers() {
    try {
      const snap   = await db.collection("subscribers").orderBy("subscribedAt", "desc").get();
      const emails = snap.docs.map(doc => doc.data().email);
      const ta     = document.getElementById("subscribersList");
      const btn    = document.getElementById("btnCopyEmails");
      if (ta)  ta.value = emails.length ? emails.join(", ") : "Nenhum inscrito ainda.";
      if (btn) btn.addEventListener("click", () => {
        if (!emails.length) { showToast("Não há e-mails para copiar.", "error"); return; }
        navigator.clipboard.writeText(emails.join(", "));
        showToast("E-mails copiados!", "success");
      });
    } catch (err) { console.error(err); }
  }

  // ========== RESET ==========
  function resetForm() {
    productForm.reset();
    editIdField.value = "";
    photoSlots = [];
    renderPhotoGrid();
    formTitle.textContent = "Adicionar Peça";
    cancelBtn.classList.add("hidden");
    document.getElementById("pAvailable").checked = true;
  }

  // ========== TOAST ==========
  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className   = "toast-msg visible " + (type || "");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("visible"), 3500);
  }
  window.showToast = showToast;

  document.addEventListener("DOMContentLoaded", init);
})();
