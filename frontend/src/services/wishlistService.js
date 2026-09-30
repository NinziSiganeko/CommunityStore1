/**
 * Wishlist storage.
 *
 * The wishlist lives in localStorage because the backend has no
 * favourites endpoint yet. It is a tiny external store so the
 * navigation badge and every product card stay in sync without
 * prop drilling.
 */

const STORAGE_KEY = "communityStoreWishlist";

let items = readStored();
const listeners = new Set();

function readStored() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .filter((item) => item && item.id)
            .map((item) => ({
                id: item.id,
                name: item.name || "Listing",
                price: item.price || "",
                priceValue: Number(item.priceValue || 0),
                img: item.img || null,
                stock: Number(item.stock || 0),
                condition: item.condition || null,
                category: item.category || null,
                seller: item.seller || null,
                sellerUserId: item.sellerUserId ?? null,
            }));
    } catch {
        return [];
    }
}

function persist(next) {
    items = next;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
        // Storage unavailable; keep the in-memory list.
    }

    listeners.forEach((listener) => listener());
}

function subscribe(listener) {
    listeners.add(listener);

    return () => listeners.delete(listener);
}

function getSnapshot() {
    return items;
}

function toWishlistEntry(product) {
    return {
        id: product.id ?? product.productId,
        name: product.name,
        price: product.price,
        priceValue: Number(product.priceValue ?? 0),
        img: product.img || null,
        stock: Number(product.stock ?? 0),
        condition: product.condition || null,
        category: product.category || null,
        seller: product.seller || null,
        sellerUserId: product.sellerUserId ?? null,
    };
}

function isWishlisted(productId) {
    return items.some((item) => String(item.id) === String(productId));
}

/**
 * Adds or removes a product.
 *
 * Returns true when the product is now saved.
 */
function toggleWishlist(product) {
    const id = product?.id ?? product?.productId;

    if (!id) {
        return false;
    }

    if (isWishlisted(id)) {
        persist(
            items.filter((item) => String(item.id) !== String(id)),
        );

        return false;
    }

    persist([...items, toWishlistEntry(product)]);

    return true;
}

function removeFromWishlist(productId) {
    persist(
        items.filter((item) => String(item.id) !== String(productId)),
    );

    return true;
}

function clearWishlist() {
    persist([]);
}

export {
    clearWishlist,
    getSnapshot,
    isWishlisted,
    removeFromWishlist,
    subscribe,
    toggleWishlist,
};