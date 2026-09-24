import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080",
});

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e2e8f0'/%3E%3Ctext x='300' y='210' text-anchor='middle' fill='%2364758b' font-family='Arial' font-size='28'%3ECommunity Store%3C/text%3E%3C/svg%3E";

function formatPrice(price) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(Number(price || 0)).replace(/\u00a0/g, " ");
}

function toImageSource(productImage) {
  if (!productImage) return FALLBACK_IMAGE;
  if (typeof productImage !== "string") return FALLBACK_IMAGE;
  if (productImage.startsWith("data:") || productImage.startsWith("http")) {
    return productImage;
  }
  return `data:image/jpeg;base64,${productImage}`;
}

function getSellerName(seller) {
  if (!seller) return null;
  return [seller.firstName, seller.lastName].filter(Boolean).join(" ") || seller.username || null;
}

function mapProduct(product) {
  return {
    id: product.productId,
    name: product.name,
    price: formatPrice(product.price),
    rating: null,
    badge: null,
    img: toImageSource(product.productImage),
    stock: product.stock,
    category: product.category?.categoryName || null,
    seller: getSellerName(product.seller),
  };
}

async function getProducts() {
  const response = await api.get("/products");
  return response.data.map(mapProduct);
}

async function getProductById(id) {
  const response = await api.get(`/products/${id}`);
  return mapProduct(response.data);
}

export { getProductById, getProducts };
