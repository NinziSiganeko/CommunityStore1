import apiClient from "./apiClient.js";
import { findOrCreateCategory } from "./categoryService.js";
import { conditionLabel, formatCurrency, normalize } from "../utils/format.js";

const FALLBACK_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e2e8f0'/%3E%3Ctext x='300' y='210' text-anchor='middle' fill='%2364758b' font-family='Arial' font-size='28'%3ECommunity Store%3C/text%3E%3C/svg%3E";

function toImageSource(productImage) {
  if (!productImage) {
    return FALLBACK_IMAGE;
  }

  if (typeof productImage !== "string") {
    return FALLBACK_IMAGE;
  }

  if (
      productImage.startsWith("data:") ||
      productImage.startsWith("http")
  ) {
    return productImage;
  }

  return `data:image/jpeg;base64,${productImage}`;
}

function getSellerName(seller) {
  if (!seller) {
    return null;
  }

  return (
      [
        seller.firstName,
        seller.lastName,
      ]
          .filter(Boolean)
          .join(" ") ||
      seller.email ||
      null
  );
}

/**
 * Normalises the product JSON from the API.
 *
 * Numeric values (priceValue, stock) are kept alongside the
 * formatted ones so the cart and checkout can calculate totals,
 * while existing screens can keep showing product.price.
 */
function mapProduct(product) {
  const priceValue = Number(product?.price || 0);
  const stock = Number(product?.stock || 0);
  const sellerUserType = product?.seller?.userType || null;

  return {
    id: product?.productId,
    name: product?.name || "Untitled listing",
    price: formatCurrency(priceValue),
    priceValue,
    rating: null,
    badge: null,
    img: toImageSource(product?.productImage),
    stock,
    inStock: stock > 0,
    condition: product?.condition || null,
    conditionLabel: conditionLabel(product?.condition),
    category: product?.category?.categoryName || null,
    categoryId: product?.category?.categoryId ?? null,

    seller: getSellerName(product?.seller),
    sellerUserId: product?.seller?.userId ?? null,
    sellerEmail: product?.seller?.email || null,
    sellerUserType,
    sellerVerified: product?.seller?.verified ?? null,

    /*
     * Verified vendors only: a vendor that has not been verified
     * by an admin cannot publish listings to buyers yet.
     */
    isPubliclyListed: !(
        sellerUserType === "VENDOR" &&
        product?.seller?.verified === false
    ),
  };
}

/**
 * Products shown in the marketplace.
 *
 * Only products with stock > 0 are shown.
 */
async function getProducts() {
  const response = await apiClient.get("/products/available");

  return response.data
      .map(mapProduct)
      .filter((product) => product.isPubliclyListed);
}

/**
 * Get every product.
 *
 * Used by Profile and My Listings so sold-out listings and
 * listings from vendors awaiting verification still appear to
 * their owner.
 */
async function getAllProducts() {
  const response = await apiClient.get("/products");

  return response.data.map(mapProduct);
}

async function getProductById(id) {
  const response = await apiClient.get(`/products/${id}`);

  return mapProduct(response.data);
}

async function createProduct({
                               name,
                               price,
                               stock,
                               condition,
                               categoryName,
                               productImage,
                               sellerId,
                             }) {
  if (
      !Number.isSafeInteger(Number(sellerId)) ||
      Number(sellerId) <= 0
  ) {
    throw new Error(
        "A valid seller account is required to create a listing.",
    );
  }

  const categoriesResponse = await apiClient.get("/categories");

  const category = await findOrCreateCategory(
      categoryName,
      categoriesResponse.data,
  );

  if (
      !Number.isSafeInteger(Number(category?.categoryId)) ||
      Number(category.categoryId) <= 0
  ) {
    throw new Error(
        "A valid product category is required to create a listing.",
    );
  }

  const productFormData = new FormData();

  productFormData.append("name", name.trim());
  productFormData.append("price", String(price));
  productFormData.append("stock", String(stock));
  productFormData.append("category_Id", String(category.categoryId));
  productFormData.append("sellerId", String(sellerId));

  if (condition) {
    productFormData.append("condition", String(condition));
  }

  if (productImage) {
    productFormData.append("productImage", productImage);
  }

  const response = await apiClient.post("/products", productFormData);

  return response.data;
}

/**
 * Updates the editable parts of a listing.
 *
 * The category, image and seller are intentionally not sent: the
 * backend keeps them from the stored listing.
 */
async function updateProduct(id, { name, price, stock, condition }) {
  const response = await apiClient.put(`/products/${id}`, {
    name,
    price,
    stock,
    condition: condition || null,
  });

  return mapProduct(response.data);
}

async function deleteProduct(id) {
  await apiClient.delete(`/products/${id}`);

  return true;
}

/**
 * Raw product JSON.
 *
 * Order history needs the original field names (seller, category,
 * productImage) to rebuild cart lines, so this skips the mapping
 * that the marketplace screens use.
 */
async function fetchProductById(productId) {
  const response = await apiClient.get(`/products/${productId}`);

  return response.data;
}

/**
 * Client-side search over the available listings.
 *
 * The campus catalogue is small enough to filter in the browser,
 * which keeps the search instant while the database grows.
 */
function filterProducts(products, filters = {}) {
  const query = normalize(filters.q);
  const category = normalize(filters.category);
  const condition = String(filters.condition || "").toUpperCase();

  const minPrice =
      filters.minPrice === "" || filters.minPrice === null || filters.minPrice === undefined
          ? null
          : Number(filters.minPrice);

  const maxPrice =
      filters.maxPrice === "" || filters.maxPrice === null || filters.maxPrice === undefined
          ? null
          : Number(filters.maxPrice);

  const filtered = products.filter((product) => {
    if (query) {
      const haystack = [
        product.name,
        product.category,
        product.seller,
      ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

      if (!haystack.includes(query)) {
        return false;
      }
    }

    if (category) {
      /*
       * "Vendors" is not a product category: it filters by the
       * seller account type instead.
       */
      if (category === "vendors") {
        if (normalize(product.sellerUserType) !== "vendor") {
          return false;
        }
      } else if (normalize(product.category) !== category) {
        return false;
      }
    }

    if (condition && String(product.condition || "").toUpperCase() !== condition) {
      return false;
    }

    if (minPrice !== null && !Number.isNaN(minPrice) && product.priceValue < minPrice) {
      return false;
    }

    if (maxPrice !== null && !Number.isNaN(maxPrice) && product.priceValue > maxPrice) {
      return false;
    }

    return true;
  });

  return sortProducts(filtered, filters.sort);
}

function sortProducts(products, sort) {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.priceValue - b.priceValue);
    case "price-desc":
      return sorted.sort((a, b) => b.priceValue - a.priceValue);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return sorted.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  }
}

export {
  createProduct,
  deleteProduct,
  fetchProductById,
  filterProducts,
  getAllProducts,
  getProductById,
  getProducts,
  mapProduct,
  sortProducts,
  updateProduct,
};
