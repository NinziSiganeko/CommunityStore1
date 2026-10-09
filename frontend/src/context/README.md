# Shared context providers

| Provider           | Provides                                                                                                      | Used by                                                           |
|--------------------|---------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
| `ToastContext.jsx` | `useToast()` → `{ showToast, toast }`                                                                         | every screen that reports success or failure                      |
| `CartContext.jsx`  | `useCart()` → `{ items, itemCount, subtotal, addItem, setQuantity, removeItem, replaceItem, clearCart, has }` | product cards, product details, cart, checkout, navigation badges |

Both providers are mounted in `src/App.jsx`, inside the router and above the
routes, so any page can read them.

Notes:

* The cart is persisted in `localStorage` (`communityStoreCart`) and is
  re-validated against the API whenever the cart screen opens — prices and
  stock are refreshed before checkout.
* The wishlist uses a small external store instead of context
  (`src/services/wishlistService.js` + `src/hooks/useWishlist.js`) because it is
  read in many small components (navigation badge, every product card).