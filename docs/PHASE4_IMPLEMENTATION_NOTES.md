# Community Store — Complete Marketplace Implementation Notes

This document summarises the full Community Store implementation: **Profile →
Category filtering → Search/filter → Cart → Marketplace Payment & Seller
Payout Routing → Orders & Post-Payment Handover → Vendor Verification →
Marketplace Chat (Facebook Marketplace style) → Community Bulletin &
Notifications**.

---

## 1. Feature Summary

| Area | Before | Now |
| --- | --- | --- |
| Profile | Listings + purchases, read-only | Editable contact details, role/verification badges, stats, quick links, recent purchases |
| Category shortcuts | Navigate only | Tiles show live counts and open a filtered marketplace |
| Product details | Toast only | Quantity picker, add to cart, split *Buy with Cash on Meetup* / *Online Business Pay*, wishlist, seller payment callout, and Facebook Marketplace-style quick chat prompts |
| Cart | Placeholder | Real persisted cart with stock re-checks, seller role metadata, quantity steppers, totals |
| Checkout & Payment | Basic radio buttons | Seller-aware checkout distinguishing **Peer Student Sellers** vs **Verified Business Vendors**, plus interactive required forms for **Cash on Meetup** (Safe Zones + time window), **Credit/Debit Card** (live card preview + validation), **Instant EFT / PayFast** (SA bank selector + reference), and **SnapScan QR** |
| Orders & Post-Payment | Backend only | Order history, 3-step Order & Payment Progress Stepper, Payment & Seller Settlement Receipt card, **Confirm Cash Paid & Collected**, **Switch to Online Payment**, **Release Safe-Pay Escrow**, *Buy again*, *Cancel order* |
| Marketplace Chat (`/chat`) | Placeholder | Full buyer–seller messaging + **Campus Community Lounge**, linked Product & Order context banner, **Propose Payment & Campus Safe Meetup** drawer, interactive **Checkout with Agreed Payment** cards, quick-reply chips |
| Community Bulletin (`/bulletin`) | Placeholder | Campus announcements, book swaps, 24/7 Safe Exchange Zone directory, category filter & post new notice |
| Notifications (`/notifications`) | Placeholder | Live alerts for unread seller messages, Cash-on-Meetup reminders, paid orders & safety tips |
| My Listings | Placeholder | Inline edit of price/stock/condition, delete listing, verification state |
| Wishlist | Toast only | Saved listings page, heart toggles everywhere, add-all-to-cart |
| Search & Filters | Visual only | Real search across name / category / seller + category, price range, condition and sort in URL |
| Vendor verification | Backend only | Admin dashboard: verification queue, verify, suspend/reactivate, stats |

---

## 2. How Marketplace Payment & Seller Payout Works

Unlike a single-company store where every payment goes to one merchant,
**Community Store** has two distinct seller types:

### A. Peer Sellers (`STUDENT`, `FACULTY`, `RESIDENT`)
* Individual students and residents often do not have a company account and do
  **not** want to post personal banking details publicly.
* **Option 1 — Cash on Meetup (`CASH`, status `PENDING`, payout `DIRECT_ON_MEETUP`):**
  * The buyer selects one of the **5 Verified Campus 24/7 Safe Exchange Zones**
    (e.g. *Student Union 24/7 Safe Zone*, *Main Library Foyer Desk*, *Engineering
    Quad Security Post*), picks a meetup window, and confirms their contact
    number.
  * Stock is reserved immediately when the order is placed.
  * Buyer and seller coordinate in **Marketplace Chat (`/chat`)**, inspect the
    item in person at the Safe Zone, and complete the cash handover.
  * On the **Order Details** screen, the buyer can tap **"Confirm Cash Paid &
    Collected"** (or switch to online payment if they agreed in Chat).
* **Option 2 — Safe-Pay Escrow (`CREDIT_CARD` / `DEBIT_CARD` / `EFT` / `SNAPSCAN`, payout `ESCROW_PEER_PROTECTION`):**
  * The buyer pays online at checkout. Community Store holds the funds in
    Safe-Pay Escrow and releases them to the student seller once the buyer taps
    **"Confirm Item Collected & Release Seller Payout"** on the order screen.

### B. Verified Campus Vendors (`VENDOR`)
* Local businesses verified by an Admin (`verified = true`) have a registered
  business payout account on the platform.
* **Direct Business Settlement (`payoutType = VENDOR_BUSINESS_ACCOUNT`):**
  * Buyers can pay online via **Credit/Debit Card**, **Instant EFT (PayFast —
    Capitec, FNB, Standard Bank, Absa, Nedbank, TymeBank)**, or **SnapScan QR**.
  * Payment is recorded as `COMPLETED` and routed directly to the vendor's
    business account, or buyers can still choose Cash on Collection at the
    vendor's campus stall.

---

## 3. Marketplace Chat (`/chat`) & Payment Negotiation

Just like Facebook Marketplace, buyers and sellers can communicate before or
after placing an order:

1. **From Product Details (`/product/:id`):**
   * Tap **"Message seller in Chat"** or any quick prompt (*"Can I pay cash when
     we meet at a campus Safe Zone?"*, *"Do you prefer Cash on Meetup, Instant
     EFT, or SnapScan?"*).
   * Opens `/chat` with the **Product Card attached** to the conversation header.
2. **Inside `/chat`:**
   * Click **"Propose Payment"** to open the Payment & Meetup Proposal builder
     (choose *Cash on Meetup*, *Card*, *Instant EFT*, or *SnapScan* + a *Campus
     Safe Exchange Zone*).
   * Sending a proposal posts an interactive **Payment Agreement Card** in the
     chat thread.
   * Clicking **"Checkout with this →"** or **"Buy with Agreed Payment"** adds
     the product to the cart and opens `/checkout?method=...&meetup=...` with the
     agreed payment method and safe meetup point pre-filled.
3. **From Order Details (`/orders/:orderId`):**
   * Tap **"Chat with seller about payment / meetup"** on any order item to
     coordinate collection or payment confirmation for that specific order
     number.

---

## 4. Files Added or Changed

### Backend (Spring Boot)

| File | Change |
| --- | --- |
| `domain/ProductCondition.java` | **new** enum `NEW, LIKE_NEW, GOOD, FAIR` |
| `domain/Product.java` | nullable `condition` column (`product_condition`), builder + `copy()` carries `seller` |
| `domain/PaymentMethod.java` | added `BANK_TRANSFER`, `CASH`, `SNAPSCAN` |
| `domain/Payment.java` | added `payoutType`, `paymentDetails`, `handoverConfirmed` fields + getters/setters/builder |
| `repository/PaymentRepository.java` | `findByCustomerOrderOrderId(Long orderId)` |
| `service/PaymentService.java` | attaches payment to existing order; `CASH` defaults to `PENDING`; added `findByOrderId` and `confirmOrderPayment` |
| `controller/PaymentController.java` | `GET /payment/order/{orderId}` and `PUT /payment/order/{orderId}/confirm` |
| `domain/ChatMessage.java` | **new** JPA entity (`chat_messages`) with sender, recipient, product/order context, `proposedPaymentMethod`, `meetupLocation` |
| `repository/ChatMessageRepository.java` | **new** repository for user & community chat queries |
| `service/ChatMessageService.java` | **new** service for sending, listing and marking conversations read |
| `controller/ChatController.java` | **new** REST controller (`/messages/user/{userId}`, `POST /messages`, `PUT /messages/read`) |
| `controller/ProductController.java` | optional `condition` on create; `PUT /products/{id}` preserves seller/image |
| `controller/UserController.java` | `GET /users/{id}`, `GET /users/vendors/pending`, `PUT /users/{id}/profile`; sign-in admits `PENDING_VERIFICATION` |
| `controller/CustomerOrderController.java` | JSON error bodies (`400/409/500`) for `POST /orders/create` |
| `service/UserService.java` | `findPendingVendors()`, `updateProfile()` |
| `util/Helper.java` | `isValidPaymentMethod` includes `CASH`, `BANK_TRANSFER`, `SNAPSCAN`; `generateTransactionReference()` |
| `config/WebConfig.java` & `application.properties` | configurable CORS origins |

### Frontend (React)

* **New Pages:** `pages/Cart.jsx`, `Checkout.jsx`, `Orders.jsx`, `OrderDetails.jsx`, `Chat.jsx`, `Bulletin.jsx`, `Notifications.jsx`, `MyListings.jsx`, `Wishlist.jsx`, `AdminDashboard.jsx`
* **New Services & Context:** `services/orderService.js`, `chatService.js`, `userService.js`, `wishlistService.js`, `context/CartContext.jsx`, `ToastContext.jsx`, `hooks/useWishlist.js`, `utils/format.js`, `components/ProductCard.jsx`, `assets/phase4.css`, `dev-mock-server.mjs`

---

## 5. Running the Project

```bash
# Option A — With MySQL + Spring Boot Backend
mvn spring-boot:run                    # http://localhost:8080

# Option B — With In-Memory Mock API (no MySQL required for demo)
cd frontend
npm install
npm run dev:mock                       # http://localhost:8080

# Start the React Frontend (in a second terminal)
cd frontend
npm run dev                            # http://localhost:5173
```

### Demo Accounts (Password: `Password1!`)
* `student@campus.ac.za` — **Lerato Dlamini (`STUDENT`)**: has 2 seeded orders (one paid by Card to a Verified Vendor, one reserved with **Cash on Meetup** from a Student Seller) and active Chat threads.
* `thabo.nkosi@campus.ac.za` — **Thabo Nkosi (`STUDENT`)**: peer student seller of the Calculus Textbook and Desk Lamp.
* `vendor@campus.ac.za` — **Kofi Mensah (`VENDOR`, Verified)**: Campus Traders Shop 4 business seller.
* `newvendor@campus.ac.za` — **Nomsa Khumalo (`VENDOR`, Pending Verification)**: awaiting admin approval.
* `admin@campus.ac.za` — **Ayanda Mokoena (`ADMIN`)**: can verify pending vendors and manage user statuses at `/admin`.
