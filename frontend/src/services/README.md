# Frontend services

All API calls go through `apiClient.js`, which points at `VITE_API_URL`
(default `/api`, proxied to `http://localhost:8080` by `vite.config.js`).

| Service              | Responsibility                                           | Backend endpoints                                                                                                                                   |
|----------------------|----------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------|
| `apiClient.js`       | axios instance + `getErrorMessage()` for readable errors | –                                                                                                                                                   |
| `authService.js`     | register, sign in/out, the stored session                | `POST /users/register`, `POST /users/signin`                                                                                                        |
| `userService.js`     | profiles, verification, account status                   | `GET /users`, `GET /users/{id}`, `GET /users/vendors/pending`, `PUT /users/{id}/profile`, `PUT /users/{id}/verify-vendor`, `PUT /users/{id}/status` |
| `productService.js`  | listings, mapping, search/filter/sort helpers            | `GET /products`, `GET /products/available`, `GET/POST/PUT/DELETE /products[/{id}]`                                                                  |
| `categoryService.js` | category list, find-or-create while selling              | `GET/POST /categories`                                                                                                                              |
| `orderService.js`    | checkout, order history, payments                        | `POST /orders/create`, `GET /orders/buyer/{userId}`, `GET /orders/{id}`, `DELETE /orders/{id}`, `POST /payment/create`                              |
| `wishlistService.js` | localStorage wishlist store                              | – (no backend endpoint yet)                                                                                                                         |

The backend is the source of truth for money and stock:

* `POST /orders/create` recalculates the total, validates stock and decrements it.
* Checkout re-reads every listing before submitting so the prices it sends match
  the database at that moment.
* Listing updates (`PUT /products/{id}`) keep the original seller, image and
  category; only name, price, stock and condition are sent.