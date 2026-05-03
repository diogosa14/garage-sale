# 🏷️ Garage Sale — Catálogo Digital

Catálogo digital premium para venda de produtos com integração WhatsApp e painel administrativo.

---

## 🚀 Como Publicar Online (Passo a Passo)

### Passo 1 — Criar Projeto no Firebase (gratuito)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** → Dê o nome "garage-sale" → Criar
3. No painel do projeto, vá em **Criação > Firestore Database** → Criar banco de dados → Modo produção
4. Vá em **Criação > Authentication** → Começar → Ative "Email/senha"
5. Em Authentication → Usuários → **Adicionar usuário** (coloque seu email e uma senha)
6. Vá em **Criação > Storage** → Começar → Aceitar as regras padrão
7. Clique na engrenagem ⚙️ → **Configurações do projeto** → Role até "Seus apps" → Clique no ícone **Web (</>)**
8. Dê um apelido (ex: "catalogo") → Registrar → Copie os valores do `firebaseConfig`

### Passo 2 — Colar as Credenciais

Abra o arquivo `js/firebase-config.js` e substitua os valores de `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",          // ← Cole seu valor aqui
  authDomain: "garage-sale-xxx.firebaseapp.com",
  projectId: "garage-sale-xxx",
  storageBucket: "garage-sale-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Passo 3 — Configurar Regras do Firestore

No Firebase Console → Firestore → Regras, cole:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Passo 4 — Configurar Regras do Storage

No Firebase Console → Storage → Regras, cole:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Passo 5 — Publicar no Netlify (gratuito)

1. Acesse [app.netlify.com](https://app.netlify.com) e crie uma conta
2. Arraste a pasta `catalogo-digital` inteira para a área de deploy
3. Pronto! Seu site estará no ar com um link `https://xxx.netlify.app`
4. Para domínio personalizado: Site settings → Domain management → Add custom domain

---

## 📱 Como Usar o Painel Admin

1. Acesse `seusite.com/admin.html`
2. Faça login com o email/senha criado no Firebase
3. **Adicionar**: Preencha o formulário e clique "Salvar"
4. **Editar**: Clique no ✏️ do produto
5. **Ocultar**: Clique no 👁️ (oculta sem excluir)
6. **Excluir**: Clique no 🗑️ (exclusão permanente)

---

## 📁 Estrutura do Projeto

```
catalogo-digital/
├── index.html          ← Catálogo público
├── admin.html          ← Painel administrativo
├── css/
│   ├── style.css       ← Estilos do catálogo
│   └── admin.css       ← Estilos do admin
├── js/
│   ├── firebase-config.js  ← Configurações e constantes
│   ├── catalog.js          ← Lógica do catálogo
│   └── admin.js            ← Lógica do admin
└── README.md           ← Este arquivo
```

## ✏️ Personalização

- **WhatsApp**: Altere `WHATSAPP_NUMBER` em `js/firebase-config.js`
- **Nome da loja**: Altere `STORE_NAME` em `js/firebase-config.js`
- **Cores**: Altere as variáveis `--primary` em `css/style.css`
- **Categorias**: Altere o array `CATEGORIES` em `js/firebase-config.js`
