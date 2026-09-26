import apiClient from "./apiClient.js";

async function getCategories() {
    const response = await apiClient.get("/categories");
    return response.data;
}

async function createCategory(categoryName) {
    const response = await apiClient.post("/categories", { categoryName });
    return response.data;
}

async function findOrCreateCategory(categoryName, categories = []) {
    const normalizedName = categoryName.trim().toLowerCase();

    const existingCategory = categories.find(
        (category) => category.categoryName?.trim().toLowerCase() === normalizedName,
    );

    if (existingCategory) {
        return existingCategory;
    }

    return createCategory(categoryName.trim());
}

export { createCategory, findOrCreateCategory, getCategories };
