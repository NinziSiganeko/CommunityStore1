import apiClient from "./apiClient.js";
import { findOrCreateCategory } from "./categoryService.js";

const FALLBACK_IMAGE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 400'%3E%3Crect width='600' height='400' fill='%23e2e8f0'/%3E%3Ctext x='300' y='210' text-anchor='middle' fill='%2364758b' font-family='Arial' font-size='28'%3ECommunity Store%3C/text%3E%3C/svg%3E";

function formatPrice(price) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  })
      .format(Number(price || 0))
      .replace(/\u00a0/g, " ");
}

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

function mapProduct(product) {
  return {
    id: product.productId,
    name: product.name,
    price: formatPrice(product.price),
    rating: null,
    badge: null,
    img: toImageSource(
        product.productImage,
    ),
    stock: product.stock,
    category:
        product.category?.categoryName ||
        null,

    seller:
        getSellerName(product.seller),

    sellerUserId:
        product.seller?.userId ||
        null,

    sellerUserType:
        product.seller?.userType ||
        null,
  };
}

/**
 * Products shown in the marketplace.
 *
 * Only products with stock > 0 are shown.
 */
async function getProducts() {
  const response =
      await apiClient.get(
          "/products/available",
      );

  return response.data.map(
      mapProduct,
  );
}

/**
 * Get every product.
 *
 * Used by Profile so a user's
 * sold-out listings can still
 * appear under My Listings.
 */
async function getAllProducts() {
  const response =
      await apiClient.get("/products");

  return response.data.map(
      mapProduct,
  );
}

async function getProductById(id) {
  const response =
      await apiClient.get(
          `/products/${id}`,
      );

  return mapProduct(
      response.data,
  );
}

async function createProduct({
                               name,
                               price,
                               stock,
                               categoryName,
                               productImage,
                               sellerId,
                             }) {
  if (
      !Number.isSafeInteger(
          Number(sellerId),
      ) ||
      Number(sellerId) <= 0
  ) {
    throw new Error(
        "A valid seller account is required to create a listing.",
    );
  }

  const categoriesResponse =
      await apiClient.get(
          "/categories",
      );

  const category =
      await findOrCreateCategory(
          categoryName,
          categoriesResponse.data,
      );

  if (
      !Number.isSafeInteger(
          Number(
              category?.categoryId,
          ),
      ) ||
      Number(category.categoryId) <=
      0
  ) {
    throw new Error(
        "A valid product category is required to create a listing.",
    );
  }

  const productFormData =
      new FormData();

  productFormData.append(
      "name",
      name.trim(),
  );

  productFormData.append(
      "price",
      String(price),
  );

  productFormData.append(
      "stock",
      String(stock),
  );

  productFormData.append(
      "category_Id",
      String(
          category.categoryId,
      ),
  );

  productFormData.append(
      "sellerId",
      String(sellerId),
  );

  if (productImage) {
    productFormData.append(
        "productImage",
        productImage,
    );
  }

  const response =
      await apiClient.post(
          "/products",
          productFormData,
      );

  return response.data;
}

export {
  createProduct,
  getAllProducts,
  getProductById,
  getProducts,
  mapProduct,
};