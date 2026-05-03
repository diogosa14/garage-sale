/* ============================================
   GARAGE SALE — Admin Panel Logic
   ============================================ */

(function () {
  "use strict";

  // DOM refs
  const loginScreen = document.getElementById("loginScreen");
  const adminApp = document.getElementById("adminApp");
  const loginForm = document.getElementById("loginForm");
  const loginError = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const setupNotice = document.getElementById("setupNotice");
  const productForm = document.getElementById("productForm");
  const formTitle = document.getElementById("formTitle");
  const editIdField = document.getElementById("editId");
  const submitBtn = document.getElementById("submitBtn");
  const cancelBtn = document.getElementById("cancelBtn");
  const productList = document.getElementById("productList");
  const uploadArea = document.getElementById("uploadArea");
  const uploadPreview = document.getElementById("uploadPreview");
  const previewImg = document.getElementById("previewImg");
  const fileInput = document.getElementById("pFile");
  const toast = document.getElementById("toast");

  let db, auth, storage;
  let products = [];
  let selectedFile = null;

  // ========== INIT ==========
  function init() {
    if (!IS_FIREBASE_CONFIGURED) {
      loginScreen.style.display = "none";
      adminApp.style.display = "block";
      setupNotice.style.display = "block";
      renderDemoList();
      updateStats(DEMO_PRODUCTS);
      return;
    }

    db = firebase.firestore();
    auth = firebase.auth();
    storage = firebase.storage();

    auth.onAuthStateChanged(user => {
      if (user) {
        showAdmin();
        loadProducts();
        loadSubscribers();
      } else {
        showLogin();
      }
    });

    bindEvents();
  }

  // ========== AUTH ==========
  function showLogin() {
    loginScreen.style.display = "flex";
    adminApp.style.display = "none";
  }

  function showAdmin() {
    loginScreen.style.display = "none";
    adminApp.style.display = "block";
  }

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    loginBtn.disabled = true;
    loginBtn.textContent = "Entrando...";
    loginError.style.display = "none";

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      loginError.textContent = getAuthError(err.code);
      loginError.style.display = "block";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Entrar";
    }
  });

  logoutBtn.addEventListener("click", () => {
    if (auth) auth.signOut();
  });

  function getAuthError(code) {
    const map = {
      "auth/user-not-found": "Usuário não encontrado.",
      "auth/wrong-password": "Senha incorreta.",
      "auth/invalid-email": "Email inválido.",
      "auth/too-many-requests": "Muitas tentativas. Aguarde e tente novamente.",
      "auth/invalid-credential": "Email ou senha incorretos."
    };
    return map[code] || "Erro ao fazer login. Tente novamente.";
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
  function renderList() {
    if (products.length === 0) {
      productList.innerHTML = '<p class="text-center text-gray-400 py-10">Nenhum produto cadastrado ainda.</p>';
      return;
    }

    productList.innerHTML = products.map(p => {
      const catObj = CATEGORIES.find(c => c.id === p.category);
      const catName = catObj ? catObj.name : p.category;
      const imgSrc = p.imageUrl || "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 56'><rect fill='%23f0dce3' width='56' height='56' rx='8'/><text x='50%25' y='50%25' fill='%233f1023' font-size='20' text-anchor='middle' dy='.35em'>📷</text></svg>";
      const availIcon = p.available !== false ? "👁️" : "🚫";
      const availTitle = p.available !== false ? "Ocultar produto" : "Tornar visível";
      const toggleBg = p.available !== false
        ? "bg-success-light text-success hover:bg-success hover:text-white"
        : "bg-gray-100 text-gray-400 hover:bg-gray-300 hover:text-white";

      return `
        <div class="bg-white rounded-xl p-3.5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md max-md:flex-wrap" data-id="${p.id}">
          <img class="w-14 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" src="${imgSrc}" alt="${p.name}"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 56 56%22><rect fill=%22%23f0dce3%22 width=%2256%22 height=%2256%22 rx=%228%22/></svg>'">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${p.name}</div>
            <div class="text-xs text-gray-400 mt-0.5">${catName} ${p.featured ? '⭐' : ''} ${p.available === false ? '• Oculto' : ''}</div>
          </div>
          <div class="font-bold text-primary text-sm whitespace-nowrap min-w-[90px] text-right max-md:min-w-0 max-md:text-left">R$ ${formatPrice(p.price)}</div>
          <div class="flex gap-1.5 flex-shrink-0">
            <button class="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-base transition-all ${toggleBg}" title="${availTitle}" onclick="adminToggle('${p.id}')">${availIcon}</button>
            <button class="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-base transition-all bg-primary-50 text-primary hover:bg-primary hover:text-white" title="Editar" onclick="adminEdit('${p.id}')">✏️</button>
            <button class="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-base transition-all bg-danger-light text-danger hover:bg-danger hover:text-white" title="Excluir" onclick="adminDelete('${p.id}')">🗑️</button>
          </div>
        </div>`;
    }).join("");
  }

  function renderDemoList() {
    products = DEMO_PRODUCTS;
    productList.innerHTML = DEMO_PRODUCTS.map(p => {
      const catObj = CATEGORIES.find(c => c.id === p.category);
      const catName = catObj ? catObj.name : p.category;
      return `
        <div class="bg-white rounded-xl p-3.5 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
          <img class="w-14 h-14 rounded-lg object-cover bg-gray-100 flex-shrink-0" src="${p.imageUrl}" alt="${p.name}">
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-sm truncate">${p.name}</div>
            <div class="text-xs text-gray-400 mt-0.5">${catName} ${p.featured ? '⭐' : ''}</div>
          </div>
          <div class="font-bold text-primary text-sm whitespace-nowrap min-w-[90px] text-right">R$ ${formatPrice(p.price)}</div>
          <div class="flex gap-1.5 flex-shrink-0">
            <span class="text-xs text-gray-400">Demo</span>
          </div>
        </div>`;
    }).join("");
  }

  // ========== STATS ==========
  function updateStats(data) {
    document.getElementById("statTotal").textContent = data.length;
    document.getElementById("statAvailable").textContent = data.filter(p => p.available !== false).length;
    document.getElementById("statFeatured").textContent = data.filter(p => p.featured).length;
    const cats = new Set(data.map(p => p.category));
    document.getElementById("statCategories").textContent = cats.size;
  }

  // ========== FORM SUBMIT ==========
  function bindEvents() {
    productForm.addEventListener("submit", handleSubmit);
    cancelBtn.addEventListener("click", resetForm);

    // File input preview
    fileInput.addEventListener("change", handleFileSelect);

    // Drag & drop
    uploadArea.addEventListener("dragover", e => { e.preventDefault(); uploadArea.classList.add("dragover"); });
    uploadArea.addEventListener("dragleave", () => uploadArea.classList.remove("dragover"));
    uploadArea.addEventListener("drop", e => {
      e.preventDefault();
      uploadArea.classList.remove("dragover");
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect();
      }
    });

    // Image URL preview
    document.getElementById("pImageUrl").addEventListener("input", e => {
      const url = e.target.value.trim();
      if (url) {
        previewImg.src = url;
        uploadPreview.style.display = "block";
      }
    });
  }

  function handleFileSelect() {
    const file = fileInput.files[0];
    if (!file) return;
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewImg.src = e.target.result;
      uploadPreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!IS_FIREBASE_CONFIGURED) {
      showToast("Configure o Firebase primeiro!", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Salvando...";

    try {
      let imageUrl = document.getElementById("pImageUrl").value.trim();

      // Upload to Cloudinary if file selected
      if (selectedFile) {
        submitBtn.textContent = "Subindo imagem...";

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const data = await response.json();

        if (data.secure_url) {
            imageUrl = data.secure_url;
        } else {
            throw new Error("Falha no upload da imagem");
        }
      }

      submitBtn.textContent = "Salvando dados...";

      const productData = {
        name: document.getElementById("pName").value.trim(),
        price: Number(document.getElementById("pPrice").value),
        category: document.getElementById("pCategory").value,
        description: document.getElementById("pDesc").value.trim(),
        imageUrl: imageUrl,
        featured: document.getElementById("pFeatured").checked,
        available: document.getElementById("pAvailable").checked,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      const editId = editIdField.value;

      if (editId) {
        await db.collection("products").doc(editId).update(productData);
        showToast("Produto atualizado! ✅", "success");
      } else {
        productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection("products").add(productData);
        showToast("Produto adicionado! ✅", "success");
      }

      resetForm();
      await loadProducts();
    } catch (err) {
      console.error(err);
      showToast("Erro ao salvar: " + err.message, "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Salvar Produto";
    }
  }

  // ========== EDIT / DELETE / TOGGLE ==========
  window.adminEdit = function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;

    editIdField.value = id;
    document.getElementById("pName").value = p.name;
    document.getElementById("pPrice").value = p.price;
    document.getElementById("pCategory").value = p.category;
    document.getElementById("pDesc").value = p.description || "";
    document.getElementById("pImageUrl").value = p.imageUrl || "";
    document.getElementById("pFeatured").checked = !!p.featured;
    document.getElementById("pAvailable").checked = p.available !== false;

    if (p.imageUrl) {
      previewImg.src = p.imageUrl;
      uploadPreview.style.display = "block";
    }

    formTitle.textContent = "✏️ Editar Produto";
    submitBtn.textContent = "Atualizar Produto";
    cancelBtn.style.display = "inline-flex";
    document.getElementById("formSection").scrollIntoView({ behavior: "smooth" });
  };

  window.adminDelete = async function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    if (!confirm(`Excluir "${p.name}"?\nEssa ação não pode ser desfeita.`)) return;

    try {
      await db.collection("products").doc(id).delete();
      showToast("Produto excluído!", "success");
      await loadProducts();
    } catch (err) {
      showToast("Erro ao excluir", "error");
    }
  };

  window.adminToggle = async function (id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    const newState = p.available === false ? true : false;

    try {
      await db.collection("products").doc(id).update({ available: newState });
      showToast(newState ? "Produto visível ✅" : "Produto oculto 🚫", "success");
      await loadProducts();
    } catch (err) {
      showToast("Erro ao alterar visibilidade", "error");
    }
  };

  // ========== NEWSLETTER ADMIN ==========
  async function loadSubscribers() {
    try {
      const snap = await db.collection("subscribers").orderBy("subscribedAt", "desc").get();
      const emails = snap.docs.map(doc => doc.data().email);

      const textArea = document.getElementById("subscribersList");
      const btnCopy = document.getElementById("btnCopyEmails");

      if (textArea && btnCopy) {
        if (emails.length === 0) {
          textArea.value = "Nenhum inscrito ainda.";
        } else {
          textArea.value = emails.join(", ");
        }

        btnCopy.addEventListener("click", () => {
          if (emails.length > 0) {
            navigator.clipboard.writeText(emails.join(", "));
            showToast("E-mails copiados com sucesso! ✅", "success");
          } else {
            showToast("Não há e-mails para copiar.", "error");
          }
        });
      }
    } catch (err) {
      console.error("Erro ao carregar inscritos:", err);
    }
  }

  // ========== HELPERS ==========
  function resetForm() {
    productForm.reset();
    editIdField.value = "";
    selectedFile = null;
    uploadPreview.style.display = "none";
    formTitle.textContent = "➕ Adicionar Produto";
    submitBtn.textContent = "Salvar Produto";
    cancelBtn.style.display = "none";
    document.getElementById("pAvailable").checked = true;
  }

  function showToast(msg, type) {
    toast.textContent = msg;
    toast.className = "toast-msg visible " + (type || "");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove("visible"), 3000);
  }

  // Expose showToast globally for newsletter copy button
  window.showToast = showToast;

  // ========== START ==========
  document.addEventListener("DOMContentLoaded", init);
})();
