# Community Store — purchase flow, listings and vendor verification

This package completes the marketplace work that has to land **before** Chat,
Notifications and the Bulletin board. Everything below is implemented in the
repository and in the accompanying zip.

Build order that was agreed:

> Profile → Category filtering → Search/filter → Cart → Checkout → Orders →
> Vendor verification → *Chat → Security hardening → final testing*

Chat, notifications and the bulletin board are intentionally still placeholder
pages (`RoutePlaceholder`), and the React Router warnings / favicon 404 were
deliberately left alone.

---

## 1. What now works

| Area | Before | Now |
| --- | --- | --- |
| Profile | Listings + purchases, read-only | Editable contact details, role/verification badges, stats, quick links, recent purchases |
| Category shortcuts | Navigate only | Tiles show live counts and open a filtered marketplace |
| Product details | Toast only | Quantity picker, add to cart, *Buy now*, wishlist, seller contact, condition and stock |
| Cart | Placeholder | Real persisted cart with stock re-checks, quantity steppers, totals |
| Checkout | Placeholder | Address + payment method, server-validated order, payment record, confirmation |
| Orders | Backend only | Order history, order detail, contact seller, buy again, cancel (returns stock) |
| My Listings | Placeholder | Inline edit of price/stock/condition, delete listing, verification state |
| Wishlist | Toast only | Saved listings page, heart toggles everywhere, add-all-to-cart |
| Search | Opened marketplace | Real search across name / category / seller, debounced, shareable links |
| Marketplace filters | Visual only | Category, price range, condition and sort — all functional |
| Vendor verification | Backend only | Admin dashboard: verification queue, verify, suspend/reactivate, stats |
| Notifications / Chat / Bulletin | Placeholder | Still placeholders (unchanged, by agreement) |

---

## 2. The purchase flow

```
Marketplace / Product details
        │  add to cart
        ▼
Cart  (re-checks price + stock against the API, clamps quantities)
        │  Proceed to checkout   (sign-in required → /login?from=/checkout)
        ▼
Checkout
   1. re-reads every listing  GET /products/{id}
   2. blocks sold-out, deleted or unverified-vendor items
   3. POST /orders/create     → backend recalculates the total and decrements stock
   4. POST /payment/create    → payment row linked to that order (failure is non-fatal)
   5. clears the cart → /orders/{orderId}?justPlaced=1
        ▼
Orders / Order details  (history, contact seller, buy again, cancel)
```

Why the frontend re-reads the listings: the cart is stored in the browser and can
be stale. Prices and stock are re-validated immediately before the order is
submitted, so what the buyer confirms is what the backend is charged for, and
`CustomerOrderService` performs the final stock check and decrement.

Checkout failures are now readable: `POST /orders/create` answers with a JSON
`{"message": "..."}` body — `400` for invalid input, `409` when an item sold out,
`500` as a last resort. The checkout screen shows that message instead of a blank
error.

## 3. Vendor verification

```
Register as VENDOR  →  UserService.register sets verified=false,
                       accountStatus=PENDING_VERIFICATION
        │
        ├─ may sign in (UserController.signIn allows PENDING_VERIFICATION)
        ├─ sees a "waiting for verification" banner on Home / Profile / Sell
        ├─ cannot publish listings (Sell is blocked, client and message)
        └─ listings are filtered out of the public marketplace
        │
Admin dashboard (/admin)
        ├─ verification queue      GET  /users/vendors/pending
        ├─ Verify vendor           PUT  /users/{id}/verify-vendor
        └─ Suspend / reactivate    PUT  /users/{id}/status?status=…
        │
Verified  →  listings become visible to buyers, seller shows a verified badge
```

`/admin` requires an admin session in the UI; as with every endpoint in the
project, server-side authorization is still part of the security-hardening phase
(see §6).

## 4. Files added or changed

### Backend (Spring Boot)

| File | Change |
| --- | --- |
| `domain/ProductCondition.java` | **new** enum `NEW, LIKE_NEW, GOOD, FAIR` |
| `domain/Product.java` | nullable `condition` column (`product_condition`), builder + `copy()` also carries `seller` |
| `domain/PaymentMethod.java` | added `BANK_TRANSFER`, `CASH` |
| `controller/ProductController.java` | optional `condition` on create; `PUT /products/{id}` now keeps the original seller/image and accepts condition |
| `controller/UserController.java` | `GET /users/{id}`, `GET /users/vendors/pending`, `PUT /users/{id}/profile`; sign-in allows `PENDING_VERIFICATION` and returns `phoneNumber`, `address`, `accountStatus` |
| `controller/CustomerOrderController.java` | JSON error bodies (`400/409/500`) for `POST /orders/create`; CORS origin list tidied |
| `service/UserService.java` | `findPendingVendors()`, `updateProfile()` (only name/phone/address are editable) |
| `service/PaymentService.java` | payment is attached to the **existing** order instead of creating a phantom order; defaults for amount/status/method/reference |
| `util/Helper.java` | `isValidPaymentMethod` aligned with the `PaymentMethod` enum; `generateTransactionReference()` |
| `config/WebConfig.java` | CORS origins come from `app.cors.allowed-origins` (defaults cover localhost + sandbox hosts) |
| `application.properties` | documents `APP_CORS_ALLOWED_ORIGINS` |

No database migration is needed: `spring.jpa.hibernate.ddl-auto=update` adds the
`product_condition` column. Listings created before this change simply show
"Not specified".

### Frontend (React)

**New**

* `context/CartContext.jsx`, `context/ToastContext.jsx`
* `services/userService.js`, `services/wishlistService.js`
* `hooks/useWishlist.js`
* `components/ProductCard.jsx`
* `pages/Cart.jsx`, `Checkout.jsx`, `Orders.jsx`, `OrderDetails.jsx`,
  `MyListings.jsx`, `Wishlist.jsx`, `AdminDashboard.jsx`
* `assets/phase4.css`
* `dev-mock-server.mjs` (optional demo API, see §5)

**Changed**

* `App.jsx`, `main.jsx`, `mainlayout/MainLayout.jsx`, `routes/AppRoutes.jsx`
* `components/Navigation.jsx`, `components/Feedback.jsx`
* `pages/Home.jsx`, `Marketplace.jsx`, `ProductDetails.jsx`, `Profile.jsx`,
  `Sell.jsx`, `Login.jsx`, `Register.jsx`, `RoutePlaceholder.jsx`
* `services/apiClient.js`, `authService.js`, `productService.js`, `orderService.js`
* `utils/format.js` (new shared formatting/condition/payment helpers)
* `vite.config.js` (dev proxy `/api` → `http://localhost:8080`, preview host
  allow-list), `package.json` (`dev:mock` script)
* `context/README.md`, `services/README.md` now document the real modules

## 5. Running it

```bash
# Backend (MySQL on localhost, database communitystoredb)
mvn spring-boot:run                    # http://localhost:8080

# Frontend
cd frontend
npm install
npm run dev                            # http://localhost:5173
```

The frontend calls `/api/...`, which Vite proxies to `http://localhost:8080`, so
there is no CORS setup needed in development. Point `VITE_API_URL` at the backend
if it runs elsewhere, and `VITE_BACKEND_URL` if the API port differs from 8080.

**No database handy?** `npm run dev:mock` starts an in-memory stand-in for the
API on port 8080 with demo accounts (password `Password1!`):
`admin@campus.ac.za`, `student@campus.ac.za`, `vendor@campus.ac.za` and
`newvendor@campus.ac.za` (waiting in the verification queue). It exists purely to
demo the UI — the Java backend remains the real thing.

## 6. Manual test checklist

1. **Marketplace** — search "lamp", filter price 100–400, pick a condition, sort by
   price, then reset. The URL keeps the filters, so a shared link reproduces them.
2. **Product** — raise the quantity, add to cart, watch the nav badge, tap *Buy now*.
3. **Cart** — change quantities, remove a row, "Clear", refresh the browser (the cart
   survives), then continue to checkout while signed out → you are sent to sign-in.
4. **Checkout** — address must be 10–200 characters; orders appear under Orders with
   the seller's contact details.
5. **Orders** — open an order, use *Buy again*, then *Cancel order* (confirm twice) and
   check the listing's stock is back on the product page.
6. **Vendor verification** — sign in as an admin, verify `newvendor@campus.ac.za`, then
   sign in as that vendor: the banner disappears and Sell works.
7. **My listings** — edit price/stock/condition, delete a listing, confirm the
   marketplace reflects it.

## 7. Limitations and what comes next

* **No server-side authorization yet.** Any client can call `/users`, `/orders`,
  `/products` and the admin endpoints. Role checks currently live in the UI only.
  This is the first item of the security-hardening phase (Spring Security, hashed
  sessions or JWT, ownership checks on orders/listings, rate limiting).
* **Orders have no status field** — `CustomerOrder.status` is commented out in the
  domain, so every order shows as *Confirmed* and cancelling deletes the order
  (restoring stock). Adding `PENDING → CONFIRMED → COLLECTED / CANCELLED` is a small
  follow-up in the domain + orders UI.
* **Search/filtering is client-side** over `/products/available` (a small campus
  catalogue). When listings grow, move it to a repository query with pagination —
  `/products/available` also returns every image as base64, so it will need a
  lighter summary payload.
* **Payments are recorded, not processed.** No card data is collected; the payment
  row documents the buyer's chosen method against the order.
* **Wishlist is per browser** (localStorage) — it needs a backend endpoint to
  follow the account.
* **Chat, notifications and bulletin** are still placeholder routes, as agreed.
* `bootstrap-vue` is an unused leftover dependency in `frontend/package.json`
  (safe to remove with `npm uninstall bootstrap-vue`).
