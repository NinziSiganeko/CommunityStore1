import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Banner, StateMessage } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { getCurrentUser } from "../services/authService.js";
import { getErrorMessage } from "../services/apiClient.js";
import {
  createOrder,
  createPaymentForOrder,
} from "../services/orderService.js";
import { getProductById } from "../services/productService.js";
import { getUserById } from "../services/userService.js";

import {
  PAYMENT_METHODS,
  SAFE_EXCHANGE_ZONES,
  SA_BANKS,
  formatCurrency,
  paymentMethodLabel,
} from "../utils/format.js";

const MIN_ADDRESS_LENGTH = 10;
const MAX_ADDRESS_LENGTH = 200;

const MEETUP_WINDOWS = [
  "Today · 14:00 – 16:00",
  "Today · 16:00 – 18:00",
  "Tomorrow · 10:00 – 12:00",
  "Tomorrow · 14:00 – 16:00",
  "Agree exact time with seller in Chat",
];

function formatCardNumberInput(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiryInput(value) {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function detectCardBrand(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (digits.startsWith("4")) {
    return "Visa";
  }
  if (/^(5[1-5]|2[2-7])/.test(digits)) {
    return "Mastercard";
  }
  return "Bank Card";
}

function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, subtotal, itemCount, clearCart, replaceItem } = useCart();
  const { showToast } = useToast();

  const user = getCurrentUser();

  const initialMethodParam = String(
    searchParams.get("method") || "",
  ).toUpperCase();
  const initialMeetupParam = searchParams.get("meetup") || "";

  const [address, setAddress] = useState(
    initialMeetupParam || user?.address || SAFE_EXCHANGE_ZONES[0].address,
  );
  const [paymentMethod, setPaymentMethod] = useState(
    PAYMENT_METHODS.some((m) => m.value === initialMethodParam)
      ? initialMethodParam
      : "CASH",
  );

  /* Cash on Meetup state */
  const [selectedZoneId, setSelectedZoneId] = useState(
    SAFE_EXCHANGE_ZONES[0].id,
  );
  const [meetupWindow, setMeetupWindow] = useState(MEETUP_WINDOWS[3]);
  const [meetupPhone, setMeetupPhone] = useState(user?.phoneNumber || "083 444 5555");
  const [cashPledge, setCashPledge] = useState(true);

  /* Card state */
  const [cardSubType, setCardSubType] = useState("DEBIT_CARD");
  const [cardHolder, setCardHolder] = useState(
    user?.displayName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "",
  );
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  /* Instant EFT state */
  const [selectedBank, setSelectedBank] = useState(SA_BANKS[0].id);
  const [eftAccountHolder, setEftAccountHolder] = useState(
    user?.displayName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "",
  );
  const [eftAccountNumber, setEftAccountNumber] = useState("");
  const [eftReference] = useState(
    () => `CS-EFT-${String(Math.floor(1000 + Math.random() * 9000))}`,
  );

  /* SnapScan QR state */
  const [snapPhone, setSnapPhone] = useState(user?.phoneNumber || "083 444 5555");
  const [snapPin, setSnapPin] = useState("");

  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);

  /* Refresh seller role & verification details for items in the cart. */
  useEffect(() => {
    if (items.length === 0) {
      return undefined;
    }

    let active = true;

    Promise.allSettled(
      items.map((item) => getProductById(item.productId)),
    ).then((results) => {
      if (!active) {
        return;
      }

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          const product = result.value;
          replaceItem(items[idx].productId, {
            seller: product.seller,
            sellerUserId: product.sellerUserId,
            sellerEmail: product.sellerEmail,
            sellerUserType: product.sellerUserType,
            sellerVerified: product.sellerVerified,
          });
        }
      });
    });

    return () => {
      active = false;
    };
  }, [items.length, replaceItem]);

  /* Pre-fill contact details from user profile when available. */
  useEffect(() => {
    if (!user?.userId) {
      return undefined;
    }

    let active = true;

    getUserById(user.userId)
      .then((profile) => {
        if (!active) {
          return;
        }
        if (profile.address && !initialMeetupParam) {
          setAddress((current) => current || profile.address);
        }
        if (profile.phoneNumber) {
          setMeetupPhone((current) => current || profile.phoneNumber);
          setSnapPhone((current) => current || profile.phoneNumber);
        }
      })
      .catch(() => {
        // Session details are sufficient fallback
      });

    return () => {
      active = false;
    };
  }, [user?.userId, initialMeetupParam]);

  /* Group cart items by seller so we can explain how each seller gets paid. */
  const sellerGroups = useMemo(() => {
    const groups = new Map();

    items.forEach((item) => {
      const key = String(item.sellerUserId || item.seller || "community");
      const isVendor = String(item.sellerUserType || "").toUpperCase() === "VENDOR";

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          sellerId: item.sellerUserId,
          sellerName: item.seller || "Community Seller",
          sellerEmail: item.sellerEmail || null,
          sellerType: item.sellerUserType || "STUDENT",
          isVendor,
          verified: Boolean(item.sellerVerified),
          items: [],
          total: 0,
        });
      }

      const group = groups.get(key);
      group.items.push(item);
      group.total += item.price * item.quantity;
    });

    return Array.from(groups.values());
  }, [items]);

  const hasPeerSeller = useMemo(
    () => sellerGroups.some((g) => !g.isVendor),
    [sellerGroups],
  );

  const hasVendorSeller = useMemo(
    () => sellerGroups.some((g) => g.isVendor),
    [sellerGroups],
  );

  const addressIsValid = useMemo(() => {
    const trimmed = address.trim();
    return (
      trimmed.length >= MIN_ADDRESS_LENGTH &&
      trimmed.length <= MAX_ADDRESS_LENGTH
    );
  }, [address]);

  const hasUnavailable = items.some(
    (item) => item.unavailable || item.stock < 1,
  );

  function selectSafeZone(zone) {
    setSelectedZoneId(zone.id);
    setAddress(zone.address);
  }

  function fillDemoCard() {
    setCardHolder(
      user?.displayName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Lerato Dlamini",
    );
    setCardNumber("4532 8910 4421 4242");
    setCardExpiry("09/28");
    setCardCvv("842");
    setError(null);
  }

  function fillDemoEft() {
    setEftAccountHolder(
      user?.displayName ||
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        "Lerato Dlamini",
    );
    setEftAccountNumber("1648920411");
    setError(null);
  }

  function fillDemoSnapScan() {
    setSnapPhone(user?.phoneNumber || "083 444 5555");
    setSnapPin("4829");
    setError(null);
  }

  function openSellerChat(group) {
    const firstItem = group?.items?.[0] || items[0];
    const params = new URLSearchParams();

    if (group?.sellerId) {
      params.set("sellerId", String(group.sellerId));
    }
    if (group?.sellerName) {
      params.set("sellerName", group.sellerName);
    }
    if (group?.sellerType) {
      params.set("sellerRole", group.sellerType);
    }
    if (firstItem?.productId) {
      params.set("productId", String(firstItem.productId));
    }

    navigate(`/chat?${params.toString()}`);
  }

  /**
   * Validates the payment-method-specific inputs and returns
   * structured metadata to store with the payment record.
   */
  function validateAndBuildPaymentMeta() {
    const resolvedPayoutType =
      paymentMethod === "CASH"
        ? "DIRECT_ON_MEETUP"
        : hasVendorSeller && !hasPeerSeller
          ? "VENDOR_BUSINESS_ACCOUNT"
          : "ESCROW_PEER_PROTECTION";

    if (paymentMethod === "CASH") {
      const phoneClean = meetupPhone.replace(/\s+/g, "");
      if (phoneClean.length < 9) {
        return {
          valid: false,
          message:
            "Please provide a valid contact phone number so the seller can reach you at the meetup point.",
        };
      }
      if (!cashPledge) {
        return {
          valid: false,
          message:
            "Please tick the confirmation box to confirm you will pay cash upon inspecting the item at meetup.",
        };
      }

      const zone = SAFE_EXCHANGE_ZONES.find((z) => z.id === selectedZoneId);
      return {
        valid: true,
        backendMethod: "CASH",
        status: "PENDING",
        payoutType: "DIRECT_ON_MEETUP",
        paymentDetails: `Cash on Meetup · ${zone ? zone.label : address.trim()} (${meetupWindow}) · Contact ${meetupPhone.trim()}`,
      };
    }

    if (paymentMethod === "CREDIT_CARD") {
      if (cardHolder.trim().length < 3) {
        return {
          valid: false,
          message: "Please enter the cardholder's full name as shown on the card.",
        };
      }
      const digits = cardNumber.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) {
        return {
          valid: false,
          message: "Please enter a valid 16-digit card number (or click 'Fill demo card').",
        };
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry.trim())) {
        return {
          valid: false,
          message: "Please enter the card expiry date in MM/YY format (e.g. 09/28).",
        };
      }
      if (!/^\d{3,4}$/.test(cardCvv.trim())) {
        return {
          valid: false,
          message: "Please enter the 3 or 4-digit CVV security code on the back of your card.",
        };
      }

      const brand = detectCardBrand(digits);
      const last4 = digits.slice(-4);
      const routingNote =
        resolvedPayoutType === "VENDOR_BUSINESS_ACCOUNT"
          ? "Settled to Verified Vendor Business Account"
          : "Held in Safe-Pay Escrow until collection";

      return {
        valid: true,
        backendMethod: cardSubType,
        status: "COMPLETED",
        payoutType: resolvedPayoutType,
        paymentDetails: `${brand} •••• ${last4} (${cardHolder.trim()}) · ${routingNote}`,
      };
    }

    if (paymentMethod === "EFT") {
      if (eftAccountHolder.trim().length < 3) {
        return {
          valid: false,
          message: "Please enter the bank account holder's name.",
        };
      }
      const accDigits = eftAccountNumber.replace(/\D/g, "");
      if (accDigits.length < 6 || accDigits.length > 20) {
        return {
          valid: false,
          message:
            "Please enter a valid bank account or registered banking mobile number (6–20 digits).",
        };
      }

      const bank =
        SA_BANKS.find((b) => b.id === selectedBank) || SA_BANKS[0];
      const last4 = accDigits.slice(-4);

      return {
        valid: true,
        backendMethod: "EFT",
        status: "COMPLETED",
        payoutType: resolvedPayoutType,
        paymentDetails: `${bank.name} Instant EFT · Acc •••• ${last4} · Ref ${eftReference}`,
      };
    }

    if (paymentMethod === "SNAPSCAN") {
      const phoneDigits = snapPhone.replace(/\D/g, "");
      if (phoneDigits.length < 9) {
        return {
          valid: false,
          message: "Please enter your registered SnapScan mobile number.",
        };
      }
      if (!/^\d{4,6}$/.test(snapPin.trim())) {
        return {
          valid: false,
          message:
            "Please enter the 4-digit SnapScan confirmation PIN (or click 'Simulate QR Scan').",
        };
      }

      return {
        valid: true,
        backendMethod: "SNAPSCAN",
        status: "COMPLETED",
        payoutType: resolvedPayoutType,
        paymentDetails: `SnapScan QR · ${snapPhone.trim()} · Auth #${snapPin.trim()}`,
      };
    }

    return {
      valid: true,
      backendMethod: paymentMethod,
      status: "COMPLETED",
      payoutType: resolvedPayoutType,
      paymentDetails: paymentMethodLabel(paymentMethod),
    };
  }

  async function placeOrder() {
    setError(null);
    setAddressTouched(true);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (!addressIsValid) {
      setError(
        `Please give a collection or delivery address between ${MIN_ADDRESS_LENGTH} and ${MAX_ADDRESS_LENGTH} characters.`,
      );
      return;
    }

    const paymentCheck = validateAndBuildPaymentMeta();
    if (!paymentCheck.valid) {
      setError(paymentCheck.message);
      return;
    }

    if (!user?.userId) {
      navigate("/login", {
        state: { from: "/checkout" },
      });
      return;
    }

    setSubmitting(true);

    try {
      const fresh = await Promise.allSettled(
        items.map((item) => getProductById(item.productId)),
      );

      const orderItems = [];
      const problems = [];

      fresh.forEach((result, index) => {
        const cartItem = items[index];

        if (result.status === "rejected") {
          problems.push(`${cartItem.name} is no longer available.`);
          return;
        }

        const product = result.value;

        if (!product.isPubliclyListed) {
          problems.push(
            `${product.name} is sold by a vendor that is not verified yet.`,
          );
          return;
        }

        if (product.stock < cartItem.quantity) {
          problems.push(
            product.stock < 1
              ? `${product.name} is sold out.`
              : `Only ${product.stock} × ${product.name} left.`,
          );
          return;
        }

        orderItems.push({
          productId: product.id,
          quantity: cartItem.quantity,
          unitPrice: product.priceValue,
        });
      });

      if (problems.length > 0) {
        setError(`Please review your cart: ${problems.join(" ")}`);
        setSubmitting(false);
        return;
      }

      const orderTotal = orderItems.reduce(
        (total, item) => total + item.unitPrice * item.quantity,
        0,
      );

      const order = await createOrder({
        buyer: user,
        items: orderItems,
        paymentMethod: paymentCheck.backendMethod,
        shippingAddress: address.trim(),
      });

      let paymentWarning = false;

      try {
        await createPaymentForOrder({
          orderId: order.orderId,
          buyerId: user.userId,
          amount: order.totalAmount || orderTotal,
          method: paymentCheck.backendMethod,
          status: paymentCheck.status,
          payoutType: paymentCheck.payoutType,
          paymentDetails: paymentCheck.paymentDetails,
          handoverConfirmed: false,
        });
      } catch {
        paymentWarning = true;
      }

      clearCart();

      showToast(
        paymentWarning
          ? "Order placed — we couldn't store the payment reference"
          : paymentCheck.backendMethod === "CASH"
            ? "Order reserved! Pay cash at your campus meetup"
            : "Payment confirmed & order placed!",
      );

      navigate(`/orders/${order.orderId}`, {
        replace: true,
        state: {
          justPlaced: true,
          paymentWarning,
        },
      });
    } catch (requestError) {
      const status = requestError?.response?.status;

      setError(
        status === 409
          ? getErrorMessage(
              requestError,
              "One of your items sold out before the order was placed.",
            )
          : getErrorMessage(
              requestError,
              "We couldn't place your order. Please try again.",
            ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="screen">
        <TopBar onBell={() => navigate("/notifications")} />

        <div className="scroll-area route-content">
          <StateMessage
            icon="bi-bag-x"
            title="Nothing to check out"
            message="Your cart is empty, so there is nothing to pay for yet."
            actionLabel="Browse marketplace"
            onAction={() => navigate("/marketplace")}
          />
        </div>

        <BottomNav />
      </div>
    );
  }

  const activeBank =
    SA_BANKS.find((b) => b.id === selectedBank) || SA_BANKS[0];

  return (
    <div className="screen">
      <TopBar onBell={() => navigate("/notifications")} />

      <div className="scroll-area route-content checkout-content">
        <div className="page-header">
          <div>
            <h1>Checkout & Payment</h1>
            <p>
              {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
              {formatCurrency(subtotal)}
            </p>
          </div>

          <button
            type="button"
            className="ghost-btn"
            onClick={() => navigate("/cart")}
          >
            <i className="bi bi-pencil" />
            Edit cart
          </button>
        </div>

        {(initialMethodParam || initialMeetupParam) && (
          <Banner
            tone="info"
            icon="bi-chat-heart"
            title="Pre-filled from your Seller Chat"
          >
            Payment method{" "}
            <strong>{paymentMethodLabel(paymentMethod)}</strong>
            {initialMeetupParam ? ` and meetup at "${initialMeetupParam}"` : ""}{" "}
            were applied from your chat agreement.
          </Banner>
        )}

        {hasUnavailable && (
          <Banner tone="warning" icon="bi-exclamation-triangle">
            Some items are no longer available.{" "}
            <button
              type="button"
              className="inline-link"
              onClick={() => navigate("/cart")}
            >
              Review your cart
            </button>{" "}
            before continuing.
          </Banner>
        )}

        {/* ── 1. Marketplace Seller & Payout Routing Breakdown ── */}
        <section className="section-card">
          <div className="section-header" style={{ padding: 0 }}>
            <h2 className="section-title">
              <i className="bi bi-shield-check" style={{ marginRight: 6, color: "#2563EB" }} />
              Who you are buying from & how payment works
            </h2>
          </div>

          <p className="section-hint">
            Community Store connects both <strong>Student / Peer Sellers</strong>{" "}
            (who may not want to share personal bank details online) and{" "}
            <strong>Verified Campus Vendors</strong> (with registered business
            accounts).
          </p>

          <div className="seller-payout-list">
            {sellerGroups.map((group) => (
              <div key={group.key} className="seller-payout-card">
                <div className="seller-payout-head">
                  <div>
                    <strong>{group.sellerName}</strong>
                    <span
                      className={`seller-role-pill ${
                        group.isVendor ? "vendor" : "peer"
                      }`}
                    >
                      {group.isVendor ? (
                        <>
                          <i className="bi bi-patch-check-fill" /> Verified
                          Business Vendor
                        </>
                      ) : (
                        <>
                          <i className="bi bi-person-badge" /> Peer Seller (
                          {group.sellerType || "STUDENT"})
                        </>
                      )}
                    </span>
                  </div>

                  <strong className="seller-payout-amount">
                    {formatCurrency(group.total)}
                  </strong>
                </div>

                <p className="seller-payout-items">
                  {group.items
                    .map((i) => `${i.quantity} × ${i.name}`)
                    .join(" · ")}
                </p>

                <div className="seller-payout-routing">
                  {group.isVendor ? (
                    <span>
                      <i className="bi bi-building-check" />{" "}
                      <strong>Business Account Settlement:</strong> Card, EFT &
                      SnapScan payments route directly to{" "}
                      <em>{group.sellerName}</em>&apos;s verified business
                      account, or pay cash at their campus stall.
                    </span>
                  ) : (
                    <span>
                      <i className="bi bi-shield-lock" />{" "}
                      <strong>Peer Seller Protection:</strong> Choose{" "}
                      <em>Cash on Meetup</em> at a 24/7 Safe Zone (no bank
                      details needed), or pay online via{" "}
                      <em>Safe-Pay Escrow</em> (funds are held by Community
                      Store and only released to {group.sellerName} after you
                      collect).
                    </span>
                  )}
                </div>

                <div className="seller-payout-actions">
                  <button
                    type="button"
                    className="ghost-btn small"
                    onClick={() => openSellerChat(group)}
                  >
                    <i className="bi bi-chat-dots" /> Discuss payment or meetup
                    in Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 2. Select Payment Method ────────────────────────── */}
        <section className="section-card">
          <h2 className="section-title">1. Choose how you want to pay</h2>

          <div className="payment-grid">
            {PAYMENT_METHODS.map((method) => {
              const selected = paymentMethod === method.value;
              return (
                <button
                  type="button"
                  key={method.value}
                  className={`payment-option ${selected ? "selected" : ""}`}
                  onClick={() => {
                    setPaymentMethod(method.value);
                    setError(null);
                  }}
                >
                  <div className="payment-option-icon">
                    <i className={`bi ${method.icon}`} />
                  </div>

                  <div className="payment-option-body">
                    <div className="payment-option-top">
                      <strong>{method.label}</strong>
                      {method.badge && (
                        <span className="payment-method-badge">
                          {method.badge}
                        </span>
                      )}
                    </div>
                    <small>{method.hint}</small>
                  </div>

                  <i
                    className={`bi ${
                      selected ? "bi-check-circle-fill" : "bi-circle"
                    } payment-radio-icon`}
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. Method-Specific Payment Details Form ─────────── */}
        <section className="section-card payment-detail-section">
          <div className="payment-detail-header">
            <h2 className="section-title">
              2. Complete {paymentMethodLabel(paymentMethod)} details
            </h2>

            {paymentMethod === "CREDIT_CARD" && (
              <button
                type="button"
                className="ghost-btn small"
                onClick={fillDemoCard}
              >
                <i className="bi bi-magic" /> Fill demo card
              </button>
            )}

            {paymentMethod === "EFT" && (
              <button
                type="button"
                className="ghost-btn small"
                onClick={fillDemoEft}
              >
                <i className="bi bi-magic" /> Fill demo EFT
              </button>
            )}

            {paymentMethod === "SNAPSCAN" && (
              <button
                type="button"
                className="ghost-btn small"
                onClick={fillDemoSnapScan}
              >
                <i className="bi bi-qr-code" /> Simulate QR Scan
              </button>
            )}
          </div>

          {/* ── FORM A: CASH ON MEETUP ── */}
          {paymentMethod === "CASH" && (
            <div className="payment-method-form">
              <div className="payment-explainer-box cash">
                <i className="bi bi-cash-stack" />
                <div>
                  <strong>How Cash on Meetup works</strong>
                  <p>
                    Your order reserves the stock immediately. You and the
                    seller meet at a <strong>Verified Campus Safe Zone</strong>,
                    you inspect the item in person, and hand over{" "}
                    <strong>{formatCurrency(subtotal)}</strong> in cash. Neither
                    party has to share bank details online.
                  </p>
                </div>
              </div>

              <div className="field-block">
                <span className="field-label">
                  Select a Verified Campus Safe Exchange Zone
                </span>
                <div className="safe-zone-grid">
                  {SAFE_EXCHANGE_ZONES.map((zone) => (
                    <button
                      type="button"
                      key={zone.id}
                      className={`safe-zone-chip ${
                        selectedZoneId === zone.id ? "active" : ""
                      }`}
                      onClick={() => selectSafeZone(zone)}
                    >
                      <div>
                        <strong>
                          <i className="bi bi-geo-alt-fill" /> {zone.label}
                        </strong>
                        <small>{zone.tag}</small>
                      </div>
                      {selectedZoneId === zone.id && (
                        <i className="bi bi-check-lg" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <label>
                  Preferred meetup window
                  <select
                    value={meetupWindow}
                    onChange={(e) => setMeetupWindow(e.target.value)}
                  >
                    {MEETUP_WINDOWS.map((win) => (
                      <option key={win} value={win}>
                        {win}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Your contact phone for meetup
                  <input
                    type="tel"
                    value={meetupPhone}
                    onChange={(e) => setMeetupPhone(e.target.value)}
                    placeholder="e.g. 083 444 5555"
                    maxLength={20}
                  />
                </label>
              </div>

              <label className="payment-checkbox-row">
                <input
                  type="checkbox"
                  checked={cashPledge}
                  onChange={(e) => setCashPledge(e.target.checked)}
                />
                <span>
                  I will bring <strong>{formatCurrency(subtotal)}</strong> in
                  cash to the agreed campus Safe Zone (or confirm payment in
                  Chat with the seller before collection).
                </span>
              </label>
            </div>
          )}

          {/* ── FORM B: CREDIT / DEBIT CARD ── */}
          {paymentMethod === "CREDIT_CARD" && (
            <div className="payment-method-form">
              <div className="card-visual-preview">
                <div className="card-visual-top">
                  <span className="card-chip-icon">
                    <i className="bi bi-cpu" />{" "}
                    {cardSubType === "DEBIT_CARD" ? "DEBIT" : "CREDIT"}
                  </span>
                  <span className="card-brand-label">
                    {detectCardBrand(cardNumber)}
                  </span>
                </div>

                <div className="card-visual-number">
                  {cardNumber || "•••• •••• •••• 4242"}
                </div>

                <div className="card-visual-bottom">
                  <div>
                    <small>CARDHOLDER</small>
                    <strong>
                      {(cardHolder || "YOUR NAME").toUpperCase()}
                    </strong>
                  </div>
                  <div>
                    <small>EXPIRES</small>
                    <strong>{cardExpiry || "MM/YY"}</strong>
                  </div>
                  <div>
                    <small>AMOUNT</small>
                    <strong>{formatCurrency(subtotal)}</strong>
                  </div>
                </div>
              </div>

              <div className="card-type-toggle">
                <button
                  type="button"
                  className={`chip-toggle ${
                    cardSubType === "DEBIT_CARD" ? "active" : ""
                  }`}
                  onClick={() => setCardSubType("DEBIT_CARD")}
                >
                  <i className="bi bi-credit-card" /> Debit / Cheque Card
                </button>
                <button
                  type="button"
                  className={`chip-toggle ${
                    cardSubType === "CREDIT_CARD" ? "active" : ""
                  }`}
                  onClick={() => setCardSubType("CREDIT_CARD")}
                >
                  <i className="bi bi-credit-card-2-front" /> Credit Card
                </button>
              </div>

              <label>
                Cardholder full name (as on card)
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="e.g. Lerato Dlamini"
                  maxLength={60}
                />
              </label>

              <label>
                Card number (16 digits)
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(e) =>
                    setCardNumber(formatCardNumberInput(e.target.value))
                  }
                  placeholder="4532 •••• •••• ••••"
                  maxLength={19}
                />
              </label>

              <div className="form-row">
                <label>
                  Expiry date (MM/YY)
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={(e) =>
                      setCardExpiry(formatExpiryInput(e.target.value))
                    }
                    placeholder="09/28"
                    maxLength={5}
                  />
                </label>

                <label>
                  CVV / CVC (3–4 digits)
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cardCvv}
                    onChange={(e) =>
                      setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    placeholder="•••"
                    maxLength={4}
                  />
                </label>
              </div>

              <div className="payment-explainer-box escrow">
                <i className="bi bi-shield-fill-check" />
                <div>
                  <strong>
                    {hasVendorSeller && !hasPeerSeller
                      ? "Direct Vendor Business Payout"
                      : "Safe-Pay Escrow & Business Routing"}
                  </strong>
                  <p>
                    {hasVendorSeller && !hasPeerSeller
                      ? "Your card payment is encrypted and settled directly to the Verified Vendor's registered business account."
                      : "For student/peer sellers, Community Store holds your payment in Safe-Pay Escrow and only releases the funds once you confirm you received the item."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── FORM C: INSTANT EFT / PAYFAST ── */}
          {paymentMethod === "EFT" && (
            <div className="payment-method-form">
              <div className="field-block">
                <span className="field-label">Select your South African bank</span>
                <div className="bank-grid">
                  {SA_BANKS.map((bank) => (
                    <button
                      type="button"
                      key={bank.id}
                      className={`bank-tile ${
                        selectedBank === bank.id ? "active" : ""
                      }`}
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <strong>{bank.name}</strong>
                      <small>Branch {bank.branchCode}</small>
                    </button>
                  ))}
                </div>
              </div>

              <div className="eft-payee-box">
                <div>
                  <span>Beneficiary</span>
                  <strong>
                    {hasVendorSeller && !hasPeerSeller
                      ? `${sellerGroups[0]?.sellerName} Business Account`
                      : "Community Store Safe-Pay Escrow Trust"}
                  </strong>
                </div>
                <div>
                  <span>Payment Reference</span>
                  <strong>{eftReference}</strong>
                </div>
                <div>
                  <span>Amount Due</span>
                  <strong>{formatCurrency(subtotal)}</strong>
                </div>
              </div>

              <div className="form-row">
                <label>
                  Your bank account holder name
                  <input
                    type="text"
                    value={eftAccountHolder}
                    onChange={(e) => setEftAccountHolder(e.target.value)}
                    placeholder="e.g. Lerato Dlamini"
                    maxLength={60}
                  />
                </label>

                <label>
                  Your {activeBank.name} account / mobile number
                  <input
                    type="text"
                    inputMode="numeric"
                    value={eftAccountNumber}
                    onChange={(e) =>
                      setEftAccountNumber(
                        e.target.value.replace(/\D/g, "").slice(0, 20),
                      )
                    }
                    placeholder="e.g. 1648920411"
                    maxLength={20}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── FORM D: SNAPSCAN QR ── */}
          {paymentMethod === "SNAPSCAN" && (
            <div className="payment-method-form">
              <div className="snapscan-card">
                <div className="snapscan-qr-box" aria-hidden="true">
                  <svg
                    width="112"
                    height="112"
                    viewBox="0 0 100 100"
                    fill="none"
                  >
                    <rect width="100" height="100" rx="8" fill="#FFFFFF" />
                    <rect x="8" y="8" width="26" height="26" stroke="#1E293B" strokeWidth="6" />
                    <rect x="16" y="16" width="10" height="10" fill="#1E293B" />
                    <rect x="66" y="8" width="26" height="26" stroke="#1E293B" strokeWidth="6" />
                    <rect x="74" y="16" width="10" height="10" fill="#1E293B" />
                    <rect x="8" y="66" width="26" height="26" stroke="#1E293B" strokeWidth="6" />
                    <rect x="16" y="74" width="10" height="10" fill="#1E293B" />
                    <rect x="42" y="12" width="8" height="8" fill="#2563EB" />
                    <rect x="42" y="26" width="8" height="16" fill="#1E293B" />
                    <rect x="52" y="42" width="14" height="8" fill="#1E293B" />
                    <rect x="14" y="44" width="20" height="8" fill="#1E293B" />
                    <rect x="42" y="56" width="10" height="10" fill="#2563EB" />
                    <rect x="64" y="56" width="12" height="12" fill="#1E293B" />
                    <rect x="80" y="46" width="12" height="20" fill="#1E293B" />
                    <rect x="44" y="74" width="18" height="8" fill="#1E293B" />
                    <rect x="68" y="76" width="22" height="14" fill="#2563EB" />
                  </svg>
                </div>

                <div className="snapscan-info">
                  <span className="payment-method-badge">
                    MERCHANT: COMMUNITY-STORE-ZA
                  </span>
                  <strong>Scan with SnapScan or Campus Wallet</strong>
                  <p>
                    Amount: <strong>{formatCurrency(subtotal)}</strong>. Enter
                    your registered mobile number and the 4-digit authorisation
                    code from the app below.
                  </p>
                </div>
              </div>

              <div className="form-row">
                <label>
                  Registered SnapScan mobile number
                  <input
                    type="tel"
                    value={snapPhone}
                    onChange={(e) => setSnapPhone(e.target.value)}
                    placeholder="e.g. 083 444 5555"
                    maxLength={20}
                  />
                </label>

                <label>
                  4-digit SnapScan authorisation PIN
                  <input
                    type="text"
                    inputMode="numeric"
                    value={snapPin}
                    onChange={(e) =>
                      setSnapPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="e.g. 4829"
                    maxLength={6}
                  />
                </label>
              </div>
            </div>
          )}
        </section>

        {/* ── 4. Collection / Meetup / Delivery Address ───────── */}
        <section className="section-card">
          <h2 className="section-title">
            3. Meetup point or campus delivery address
          </h2>

          <p className="section-hint">
            Shared with the seller on your order receipt and in Chat so you can
            complete the handover safely.
          </p>

          <textarea
            className={`text-area ${
              addressTouched && !addressIsValid ? "invalid" : ""
            }`}
            rows="2"
            maxLength={MAX_ADDRESS_LENGTH}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            onBlur={() => setAddressTouched(true)}
            placeholder="e.g. Student Union 24/7 Safe Zone, or 12 Campus Road, Res Block B"
          />

          <p className="field-help">
            {address.trim().length}/{MAX_ADDRESS_LENGTH} characters (minimum{" "}
            {MIN_ADDRESS_LENGTH})
          </p>
        </section>

        {/* ── 5. Order Summary ────────────────────────────────── */}
        <section className="section-card">
          <h2 className="section-title">Order summary</h2>

          <div className="summary-list">
            {items.map((item) => (
              <div key={item.productId} className="summary-line">
                <span className="summary-line-name">
                  {item.quantity} × {item.name}
                  {item.seller ? (
                    <small className="summary-line-seller">
                      {" "}
                      · {item.seller}
                    </small>
                  ) : null}
                </span>

                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-row">
            <span>Payment method</span>
            <strong>{paymentMethodLabel(paymentMethod)}</strong>
          </div>

          <div className="summary-row">
            <span>Payment timing</span>
            <strong>
              {paymentMethod === "CASH"
                ? "Pay in person on meetup"
                : "Paid now (instant confirmation)"}
            </strong>
          </div>

          <div className="summary-row total">
            <span>Total</span>
            <strong>{formatCurrency(subtotal)}</strong>
          </div>
        </section>

        {error && (
          <Banner
            tone="error"
            icon="bi-exclamation-octagon"
            title="Please check your payment details"
          >
            {error}
          </Banner>
        )}

        <button
          type="button"
          className="primary-action full"
          onClick={placeOrder}
          disabled={submitting || hasUnavailable}
        >
          {submitting ? (
            "Processing order..."
          ) : paymentMethod === "CASH" ? (
            <>
              <i className="bi bi-bag-check" /> Reserve order & pay{" "}
              {formatCurrency(subtotal)} on meetup
            </>
          ) : (
            <>
              <i className="bi bi-lock-fill" /> Pay {formatCurrency(subtotal)}{" "}
              & place order
            </>
          )}
        </button>

        <button
          type="button"
          className="ghost-btn full"
          onClick={() => navigate("/cart")}
          disabled={submitting}
        >
          Back to cart
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export default Checkout;
