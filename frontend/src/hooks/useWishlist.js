import { useSyncExternalStore } from "react";

import {
    getSnapshot,
    isWishlisted,
    removeFromWishlist,
    subscribe,
    toggleWishlist,
} from "../services/wishlistService.js";

/**
 * Reads the localStorage-backed wishlist and keeps the component
 * in sync with every other component using it.
 */
function useWishlist() {
    // The third argument keeps the hook valid if it is ever rendered
    // on the server (it falls back to the in-memory snapshot).
    const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    return {
        items,
        count: items.length,
        has: (productId) => isWishlisted(productId),
        toggle: toggleWishlist,
        remove: removeFromWishlist,
    };
}

export default useWishlist;