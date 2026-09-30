/**
 * OPTIONAL local mock of the Community Store API.
 *
 * Use it to click through the marketplace, cart, checkout, orders and
 * admin screens without MySQL and Spring Boot running:
 *
 *   npm run dev:mock      # terminal 1 — mock API on :8080
 *   npm run dev           # terminal 2 — React app on :5173
 *
 * The real backend (src/main/java/...) is still what the app ships
 * with; this file only exists so the frontend can be demoed or
 * developed when the database is not available. It keeps everything
 * in memory, so a restart resets the data.
 *
 * Demo accounts (password: Password1!)
 *   admin@campus.ac.za    ADMIN
 *   student@campus.ac.za  STUDENT
 *   vendor@campus.ac.za   VENDOR (already verified)
 *   newvendor@campus.ac.za VENDOR (waiting for verification)
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT || 8080);

const categories = [
  { categoryId: 1, categoryName: "Textbooks" },
  { categoryId: 2, categoryName: "Electronics" },
  { categoryId: 3, categoryName: "Services" },
  { categoryId: 4, categoryName: "Dorm Essentials" },
];

const users = [
  {
    userId: 1,
    email: "admin@campus.ac.za",
    password: "Password1!",
    firstName: "Ayanda",
    lastName: "Mokoena",
    phoneNumber: "082 111 2222",
    address: "Student Affairs, Main Campus",
    userType: "ADMIN",
    verified: true,
    accountStatus: "ACTIVE",
  },
  {
    userId: 2,
    email: "student@campus.ac.za",
    password: "Password1!",
    firstName: "Lerato",
    lastName: "Dlamini",
    phoneNumber: "083 444 5555",
    address: "12 Campus Road, Res Block B, Room 214",
    userType: "STUDENT",
    verified: true,
    accountStatus: "ACTIVE",
  },
  {
    userId: 3,
    email: "vendor@campus.ac.za",
    password: "Password1!",
    firstName: "Kofi",
    lastName: "Mensah",
    phoneNumber: "084 777 8888",
    address: "Campus Traders, Shop 4",
    userType: "VENDOR",
    verified: true,
    accountStatus: "ACTIVE",
  },
  {
    userId: 4,
    email: "newvendor@campus.ac.za",
    password: "Password1!",
    firstName: "Nomsa",
    lastName: "Khumalo",
    phoneNumber: "081 333 9999",
    address: "Food Court, Main Campus",
    userType: "VENDOR",
    verified: false,
    accountStatus: "PENDING_VERIFICATION",
  },
];

const products = [
  {
    productId: 1,
    name: "Prescribed Calculus Textbook (3rd ed.)",
    price: 549.0,
    stock: 4,
    condition: "GOOD",
    categoryId: 1,
    sellerId: 2,
  },
  {
    productId: 2,
    name: "Dorm Kettle 1.7L",
    price: 320.5,
    stock: 7,
    condition: "NEW",
    categoryId: 4,
    sellerId: 2,
  },
  {
    productId: 3,
    name: "USB-C Laptop Charger 65W",
    price: 780.0,
    stock: 3,
    condition: "LIKE_NEW",
    categoryId: 2,
    sellerId: 3,
  },
  {
    productId: 4,
    name: "Second-hand Desk Lamp",
    price: 150.0,
    stock: 0,
    condition: "FAIR",
    categoryId: 4,
    sellerId: 1,
  },
  {
    productId: 5,
    name: "Stats Tutoring Session (1 hour)",
    price: 220.0,
    stock: 12,
    condition: "NEW",
    categoryId: 3,
    sellerId: 3,
  },
  {
    productId: 6,
    name: "Unverified Vendor Test Item",
    price: 99.0,
    stock: 5,
    condition: "GOOD",
    categoryId: 2,
    sellerId: 4,
  },
];

let orders = [
  {
    orderId: 1,
    orderNumber: "ORD-20260801-0042",
    orderDate: "2026-08-01T09:15:00",
    totalAmount: 549,
    paymentMethod: "CREDIT_CARD",
    shippingAddress: "12 Campus Road, Res Block B, Room 214",
    buyerId: 2,
    orderItems: [
      {
        orderItemId: 1,
        productId: 1,
        quantity: 1,
        unitPrice: 549,
        subtotal: 549,
      },
    ],
  },
];

const payments = [];

/* ── helpers ─────────────────────────────────────────────── */

function send(response, status, body) {
  const payload = body === undefined ? "" : JSON.stringify(body);

  response.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "*",
  });

  response.end(payload);
}

function categoryOf(product) {
  return categories.find((category) => category.categoryId === product.categoryId);
}

function sellerOf(product) {
  return users.find((user) => user.userId === product.sellerId);
}

function toProductJson(product) {
  const category = categoryOf(product);
  const seller = sellerOf(product);

  return {
    productId: product.productId,
    name: product.name,
    price: product.price,
    stock: product.stock,
    condition: product.condition,
    productImage: null,
    category: category
        ? { categoryId: category.categoryId, categoryName: category.categoryName }
        : null,
    seller: seller
        ? {
          userId: seller.userId,
          email: seller.email,
          firstName: seller.firstName,
          lastName: seller.lastName,
          userType: seller.userType,
          verified: seller.verified,
        }
        : null,
  };
}

function toUserJson(user) {
  return {
    userId: user.userId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phoneNumber: user.phoneNumber,
    address: user.address,
    userType: user.userType,
    verified: user.verified,
    accountStatus: user.accountStatus,
  };
}

function toOrderJson(order) {
  const buyer = users.find((user) => user.userId === order.buyerId);

  return {
    orderId: order.orderId,
    orderNumber: order.orderNumber,
    orderDate: order.orderDate,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    shippingAddress: order.shippingAddress,
    buyer: buyer ? toUserJson(buyer) : null,
    orderItems: order.orderItems.map((item) => {
      const product = products.find(
          (candidate) => candidate.productId === item.productId,
      );

      return {
        orderItemId: item.orderItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
        product: product ? toProductJson(product) : null,
      };
    }),
  };
}

async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/* ── request handling ────────────────────────────────────── */

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = request.method;

  if (method === "OPTIONS") {
    return send(response, 204);
  }

  /* users */
  if (path === "/users/signin" && method === "POST") {
    const body = await readJson(request);
    const user = users.find(
        (candidate) =>
            candidate.email.toLowerCase() ===
            String(body.email || "").trim().toLowerCase(),
    );

    if (!user || user.password !== body.password) {
      return send(response, 401, { message: "Invalid email or password" });
    }

    if (
        user.accountStatus !== "ACTIVE" &&
        user.accountStatus !== "PENDING_VERIFICATION"
    ) {
      return send(response, 401, { message: "Account is not active" });
    }

    return send(response, 200, {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.userType,
      verified: user.verified,
      accountStatus: user.accountStatus,
    });
  }

  if (path === "/users/register" && method === "POST") {
    const body = await readJson(request);

    if (users.some((user) => user.email.toLowerCase() === String(body.email).toLowerCase())) {
      return send(response, 400, { message: "Email is already registered" });
    }

    const isVendor = body.userType === "VENDOR";

    const user = {
      userId: users.length + 1,
      email: body.email,
      password: body.password,
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      phoneNumber: body.phoneNumber || "",
      address: body.address || "",
      userType: isVendor ? "VENDOR" : body.userType || "RESIDENT",
      verified: !isVendor,
      accountStatus: isVendor ? "PENDING_VERIFICATION" : "ACTIVE",
    };

    users.push(user);

    return send(response, 201, toUserJson(user));
  }

  if (path === "/users" && method === "GET") {
    return send(response, 200, users.map(toUserJson));
  }

  if (path === "/users/vendors/pending" && method === "GET") {
    return send(
        response,
        200,
        users.filter((user) => user.userType === "VENDOR" && !user.verified).map(toUserJson),
    );
  }

  const userMatch = path.match(/^\/users\/(\d+)(\/profile|\/verify-vendor|\/status)?$/);

  if (userMatch) {
    const user = users.find((candidate) => candidate.userId === Number(userMatch[1]));

    if (!user) {
      return send(response, 404, { message: "User not found" });
    }

    if (method === "GET" && !userMatch[2]) {
      return send(response, 200, toUserJson(user));
    }

    if (method === "PUT" && userMatch[2] === "/profile") {
      const body = await readJson(request);

      ["firstName", "lastName", "phoneNumber", "address"].forEach((field) => {
        if (body[field] !== null && body[field] !== undefined) {
          user[field] = String(body[field]).trim();
        }
      });

      return send(response, 200, toUserJson(user));
    }

    if (method === "PUT" && userMatch[2] === "/verify-vendor") {
      if (user.userType !== "VENDOR") {
        return send(response, 400, { message: "Only vendors require verification" });
      }

      user.verified = true;
      user.accountStatus = "ACTIVE";

      return send(response, 200, toUserJson(user));
    }

    if (method === "PUT" && userMatch[2] === "/status") {
      const status = url.searchParams.get("status");

      if (!["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DEACTIVATED"].includes(status)) {
        return send(response, 400, { message: "Unknown account status" });
      }

      user.accountStatus = status;

      return send(response, 200, toUserJson(user));
    }
  }

  /* categories */
  if (path === "/categories" && method === "GET") {
    return send(response, 200, categories);
  }

  if (path === "/categories" && method === "POST") {
    const body = await readJson(request);
    const name = String(body.categoryName || "").trim();

    const existing = categories.find(
        (category) => category.categoryName.toLowerCase() === name.toLowerCase(),
    );

    if (existing) {
      return send(response, 200, existing);
    }

    const category = {
      categoryId: categories.length + 1,
      categoryName: name,
    };

    categories.push(category);

    return send(response, 200, category);
  }

  /* products */
  if (path === "/products" && method === "GET") {
    return send(response, 200, products.map(toProductJson));
  }

  if (path === "/products/available" && method === "GET") {
    return send(
        response,
        200,
        products.filter((product) => product.stock > 0).map(toProductJson),
    );
  }

  if (path === "/products" && method === "POST") {
    const raw = await readRaw(request);
    const form = parseMultipart(raw);

    const product = {
      productId: products.length + 1,
      name: form.name || "Untitled",
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      condition: form.condition || null,
      categoryId: Number(form.category_Id || 1),
      sellerId: Number(form.sellerId),
    };

    products.push(product);

    return send(response, 200, toProductJson(product));
  }

  const productMatch = path.match(/^\/products\/(\d+)$/);

  if (productMatch) {
    const product = products.find(
        (candidate) => candidate.productId === Number(productMatch[1]),
    );

    if (!product) {
      return send(response, 404, { message: "Product not found" });
    }

    if (method === "GET") {
      return send(response, 200, toProductJson(product));
    }

    if (method === "PUT") {
      const body = await readJson(request);

      if (body.name !== undefined) product.name = String(body.name).trim();
      if (body.price !== undefined) product.price = Number(body.price);
      if (body.stock !== undefined) product.stock = Number(body.stock);
      if (body.condition !== undefined) product.condition = body.condition;
      if (body.category?.categoryId) product.categoryId = Number(body.category.categoryId);

      return send(response, 200, toProductJson(product));
    }

    if (method === "DELETE") {
      products.splice(products.indexOf(product), 1);
      return send(response, 200, {});
    }
  }

  /* orders */
  if (path === "/orders/create" && method === "POST") {
    const body = await readJson(request);
    const buyerId = Number(body.buyer?.userId);

    if (!buyerId) {
      return send(response, 400, { message: "Buyer is required" });
    }

    if (!Array.isArray(body.orderItems) || body.orderItems.length === 0) {
      return send(response, 400, { message: "Order must contain at least one item" });
    }

    const address = String(body.shippingAddress || "").trim();

    if (address.length < 10 || address.length > 200) {
      return send(response, 400, { message: "Shipping address must be between 10-200 characters" });
    }

    const items = [];

    for (const item of body.orderItems) {
      const product = products.find(
          (candidate) => candidate.productId === Number(item.product?.productId),
      );

      if (!product) {
        return send(response, 409, { message: "A product in this order no longer exists." });
      }

      if (product.stock < item.quantity) {
        return send(response, 409, {
          message: `Insufficient stock for product: ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`,
        });
      }
    }

    for (const item of body.orderItems) {
      const product = products.find(
          (candidate) => candidate.productId === Number(item.product?.productId),
      );

      product.stock -= item.quantity;

      items.push({
        orderItemId: items.length + 1,
        productId: product.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.quantity * item.unitPrice,
      });
    }

    const order = {
      orderId: orders.length + 1,
      orderNumber: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(
          Math.floor(Math.random() * 10000),
      ).padStart(4, "0")}`,
      orderDate: new Date().toISOString().slice(0, 19),
      totalAmount: items.reduce((total, item) => total + item.subtotal, 0),
      paymentMethod: String(body.paymentMethod || "EFT").toUpperCase(),
      shippingAddress: address,
      buyerId,
      orderItems: items,
    };

    orders.push(order);

    return send(response, 200, toOrderJson(order));
  }

  if (path.startsWith("/orders/buyer/") && method === "GET") {
    const buyerId = Number(path.split("/").pop());

    return send(
        response,
        200,
        orders
            .filter((order) => order.buyerId === buyerId)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .map(toOrderJson),
    );
  }

  if (path === "/orders" && method === "GET") {
    return send(response, 200, orders.map(toOrderJson));
  }

  const orderMatch = path.match(/^\/orders\/(\d+)$/);

  if (orderMatch) {
    const order = orders.find((candidate) => candidate.orderId === Number(orderMatch[1]));

    if (!order) {
      return send(response, 404, { message: "Order not found" });
    }

    if (method === "GET") {
      return send(response, 200, toOrderJson(order));
    }

    if (method === "DELETE") {
      order.orderItems.forEach((item) => {
        const product = products.find(
            (candidate) => candidate.productId === item.productId,
        );

        if (product) {
          product.stock += item.quantity;
        }
      });

      orders = orders.filter((candidate) => candidate.orderId !== order.orderId);

      return send(response, 200, {});
    }
  }

  /* payments */
  if (path === "/payment/create" && method === "POST") {
    const body = await readJson(request);
    const order = orders.find(
        (candidate) => candidate.orderId === Number(body.customerOrder?.orderId),
    );

    if (!order) {
      return send(response, 400, { error: "A valid order is required before taking payment." });
    }

    const payment = {
      paymentId: payments.length + 1,
      amount: Number(body.amount || order.totalAmount),
      status: body.status || "COMPLETED",
      method: body.method || "EFT",
      transactionReference: `PAY-${Date.now()}`,
      orderId: order.orderId,
    };

    payments.push(payment);

    return send(response, 200, payment);
  }

  return send(response, 404, { message: `No mock route for ${method} ${path}` });
});

/* Minimal multipart parsing: enough for the Sell form. */
async function readRaw(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("latin1");
}

function parseMultipart(raw) {
  const fields = {};

  raw.split(/\r?\n/).forEach((line) => {
    const fieldMatch = line.match(/name="([^"]+)"/);

    if (fieldMatch && !line.includes("filename=")) {
      fields[`__pending_${fieldMatch[1]}`] = true;
    }
  });

  const names = Object.keys(fields).map((key) => key.replace("__pending_", ""));

  names.forEach((name) => {
    const match = raw.match(
        new RegExp(`name="${name}"\\r?\\n\\r?\\n([\\s\\S]*?)\\r?\\n--`),
    );

    fields[name] = match ? match[1] : "";
  });

  return fields;
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Mock Community Store API listening on http://localhost:${PORT}`);
  console.log("Demo password for every seeded account: Password1!");
});
