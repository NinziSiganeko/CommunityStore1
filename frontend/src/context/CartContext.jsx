import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const STORAGE_KEY = "communityStoreCart";

const CartContext = createContext(null);

/**
 * Reads the saved cart.
 *
 * Anything unreadable is treated as an empty cart so a broken
 * localStorage entry can never block the app.
 */
function readStoredCart() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        /*
         * "unavailable" is intentionally not restored: the cart screen
         * re-checks every line against the API when it opens.
         */
        return parsed
            .filter((item) => item && item.productId)
            .map((item) => ({
                productId: item.productId,
                name: item.name || "Listing",
                price: Number(item.price || 0),
                img: item.img || null,
                stock: Number(item.stock || 0),
                category: item.category || null,
                seller: item.seller || null,
                sellerUserId: item.sellerUserId ?? null,
                sellerEmail: item.sellerEmail || null,
                sellerUserType: item.sellerUserType || null,
                sellerVerified:
                    typeof item.sellerVerified === "boolean"
                        ? item.sellerVerified
                        : null,
                condition: item.condition || null,
                quantity: Math.max(1, Number(item.quantity || 1)),
            }));
    } catch {
        return [];
    }
}

/**
 * Turns a marketplace product into a cart line.
 *
 * "unavailable" is reset because the product was just picked from
 * the live marketplace.
 */
function toCartLine(product, quantity) {
    return {
        productId: product.id ?? product.productId,
        name: product.name,
        price: Number(product.priceValue ?? product.price ?? 0),
        img: product.img || null,
        stock: Number(product.stock ?? 0),
        category: product.category || null,
        seller: product.seller || null,
        sellerUserId: product.sellerUserId ?? null,
        sellerEmail: product.sellerEmail || null,
        sellerUserType: product.sellerUserType || null,
        sellerVerified:
            typeof product.sellerVerified === "boolean"
                ? product.sellerVerified
                : null,
        condition: product.condition || null,
        quantity: Math.max(1, Number(quantity || 1)),
        unavailable: false,
    };
}

function CartProvider({ children }) {
    const [items, setItems] = useState(readStoredCart);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        } catch {
            // Storage may be full or unavailable; the in-memory cart still works.
        }
    }, [items]);

    /**
     * Adds a product, or increases the quantity when it is already
     * in the cart. Quantities are capped by the available stock.
     */
    const addItem = useCallback((product, quantity = 1) => {
        const line = toCartLine(product, quantity);
        let applied = line.quantity;

        setItems((previous) => {
            const existingIndex = previous.findIndex(
                (item) => String(item.productId) === String(line.productId),
            );

            if (existingIndex === -1) {
                return [...previous, line];
            }

            return previous.map((item, index) => {
                if (index !== existingIndex) {
                    return item;
                }

                const stockLimit = line.stock > 0 ? line.stock : item.stock;
                const nextQuantity = Math.min(
                    item.quantity + line.quantity,
                    stockLimit > 0 ? stockLimit : item.quantity + line.quantity,
                );

                applied = nextQuantity;

                return {
                    ...item,
                    ...line,
                    quantity: nextQuantity,
                };
            });
        });

        return applied;
    }, []);

    const removeItem = useCallback((productId) => {
        setItems((previous) =>
            previous.filter(
                (item) => String(item.productId) !== String(productId),
            ),
        );
    }, []);

    const setQuantity = useCallback((productId, quantity) => {
        setItems((previous) =>
            previous.map((item) => {
                if (String(item.productId) !== String(productId)) {
                    return item;
                }

                const requested = Number(quantity);

                if (!Number.isFinite(requested) || requested < 1) {
                    return item;
                }

                const stockLimit = item.stock > 0 ? item.stock : requested;

                return {
                    ...item,
                    quantity: Math.min(Math.floor(requested), stockLimit),
                };
            }),
        );
    }, []);

    /**
     * Replaces stored lines with fresher data from the API
     * (price and stock are re-checked on the cart screen).
     */
    const replaceItem = useCallback((productId, changes) => {
        setItems((previous) =>
            previous.map((item) =>
                String(item.productId) === String(productId)
                    ? { ...item, ...changes }
                    : item,
            ),
        );
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const itemCount = useMemo(
        () => items.reduce((total, item) => total + item.quantity, 0),
        [items],
    );

    const subtotal = useMemo(
        () => items.reduce((total, item) => total + item.price * item.quantity, 0),
        [items],
    );

    const value = useMemo(
        () => ({
            items,
            itemCount,
            subtotal,
            addItem,
            clearCart,
            removeItem,
            replaceItem,
            setQuantity,
            has: (productId) =>
                items.some((item) => String(item.productId) === String(productId)),
        }),
        [items, itemCount, subtotal, addItem, clearCart, removeItem, replaceItem, setQuantity],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }

    return context;
}

export { CartProvider, useCart };