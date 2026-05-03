/* ============================================
   GARAGE SALE — Firebase Config & Constants
   ============================================ */

const firebaseConfig = {
  apiKey: "AIzaSyDt3wVzhMMbbhIZpbGUkohpFPDHs23FX_M",
  authDomain: "garage-sale-8af60.firebaseapp.com",
  projectId: "garage-sale-8af60",
  storageBucket: "garage-sale-8af60.firebasestorage.app",
  messagingSenderId: "892318368776",
  appId: "1:892318368776:web:ca955d533ed79663043dbd",
  measurementId: "G-X6B9BX5HE6"
};

const IS_FIREBASE_CONFIGURED = firebaseConfig.apiKey !== "YOUR_API_KEY";

if (IS_FIREBASE_CONFIGURED) {
  firebase.initializeApp(firebaseConfig);
}

const CLOUDINARY_CLOUD_NAME = "dwj2wckrm";
const CLOUDINARY_UPLOAD_PRESET = "catalogo_fotos";

const WHATSAPP_NUMBER = "5531992428170";
const STORE_NAME = "Garage Sale";
const SELLER_NAME = "Janice";

const CATEGORIES = [
  { id: "todos", name: "Todos", icon: "✦" },
  { id: "sala", name: "Sala", icon: "🛋️" },
  { id: "cozinha", name: "Cozinha", icon: "🍳" },
  { id: "quarto", name: "Quarto", icon: "🛏️" },
  { id: "banheiro", name: "Banheiro", icon: "🚿" },
  { id: "area-externa", name: "Área Externa", icon: "🌳" },
  { id: "eletros", name: "Eletrodomésticos", icon: "⚡" },
  { id: "oportunidades", name: "Oportunidades", icon: "🏷️" }
];

const DEMO_PRODUCTS = [
  {
    id: "demo-1",
    name: "Sofá 3 Lugares Retrátil",
    description: "Sofá em tecido suede cinza, retrátil e reclinável. Estrutura em madeira maciça. Excelente estado de conservação, sem manchas ou rasgos. Ideal para sala de estar ampla.",
    price: 1890,
    category: "sala",
    imageUrl: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=600&fit=crop",
    featured: true,
    available: true
  },
  {
    id: "demo-2",
    name: "Mesa de Jantar 6 Lugares",
    description: "Mesa retangular em MDF com tampo em vidro temperado. Pés em aço escovado. Acompanha 6 cadeiras estofadas em couro sintético bege. Semi-nova.",
    price: 1450,
    category: "cozinha",
    imageUrl: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&h=600&fit=crop",
    featured: true,
    available: true
  },
  {
    id: "demo-3",
    name: "Geladeira Frost Free 375L",
    description: "Geladeira Electrolux Frost Free, 375 litros, inox. Duplex com dispenser de água. Funcionando perfeitamente, sem amassados.",
    price: 2200,
    category: "eletros",
    imageUrl: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-4",
    name: "Luminária de Piso Articulada",
    description: "Luminária de chão em metal preto fosco com braço articulável. Altura regulável até 1,80m. Design moderno e minimalista. Bivolt.",
    price: 380,
    category: "sala",
    imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-5",
    name: "Jogo de Panelas Inox 5 Peças",
    description: "Conjunto de panelas em aço inox com fundo triplo. Inclui: 2 caçarolas, 1 frigideira, 1 leiteira e 1 panela de pressão. Pouco uso.",
    price: 290,
    category: "cozinha",
    imageUrl: "https://images.unsplash.com/photo-1584990347449-a0cc04fb1096?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-6",
    name: "Poltrona Decorativa Veludo",
    description: "Poltrona em veludo verde musgo com pés palito em madeira natural. Perfeita para cantinho de leitura. Estado impecável.",
    price: 950,
    category: "sala",
    imageUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=600&fit=crop",
    featured: true,
    available: true
  },
  {
    id: "demo-7",
    name: "Máquina de Lavar 11kg",
    description: "Lavadora Brastemp 11kg, modelo BWK11. Branca, com 15 programas de lavagem. Funcionamento perfeito, sem barulhos.",
    price: 1650,
    category: "eletros",
    imageUrl: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-8",
    name: "Espelho Redondo com Moldura",
    description: "Espelho redondo decorativo, 80cm de diâmetro. Moldura em metal dourado fosco. Ideal para hall de entrada ou banheiro. Inclui kit fixação.",
    price: 420,
    category: "quarto",
    imageUrl: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-9",
    name: "Churrasqueira Portátil Inox",
    description: "Churrasqueira a carvão em aço inox, modelo portátil com rodízios. Área de grelha 60x40cm. Acompanha espetos e garra. Usada 3x.",
    price: 580,
    category: "area-externa",
    imageUrl: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-10",
    name: "Aparador de Console Slim",
    description: "Aparador em MDF com acabamento em carvalho natural. Design slim, 120x30x80cm. Duas gavetas com puxadores em metal. Perfeito para corredor ou entrada.",
    price: 760,
    category: "sala",
    imageUrl: "https://images.unsplash.com/photo-1611967164521-abae8fba4668?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-11",
    name: "Micro-ondas 32L Inox",
    description: "Micro-ondas Panasonic 32 litros, painel digital, 10 níveis de potência. Cor inox. Funcionando 100%, sem manchas internas.",
    price: 450,
    category: "eletros",
    imageUrl: "https://images.unsplash.com/photo-1574269909862-7e3d7bc4e37a?w=600&h=600&fit=crop",
    featured: false,
    available: true
  },
  {
    id: "demo-12",
    name: "Rede de Descanso Casal",
    description: "Rede de algodão cru, tamanho casal (3,50m). Punhos em crochê artesanal. Suporta até 200kg. Nova, nunca usada — presente que não coube na varanda.",
    price: 320,
    category: "area-externa",
    imageUrl: "https://images.unsplash.com/photo-1520038410233-7141be7e6f97?w=600&h=600&fit=crop",
    featured: false,
    available: true
  }
];

function generateWhatsAppLink(product) {
  const msg = encodeURIComponent(
    `Olá, ${SELLER_NAME}! 😊\n\nVi o produto *${product.name}* por *R$ ${product.price.toLocaleString("pt-BR")}* no catálogo ${STORE_NAME} e tenho interesse!\n\nPodemos negociar?`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
}

function formatPrice(value) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}