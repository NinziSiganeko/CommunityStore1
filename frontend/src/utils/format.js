/**
 * Shared display helpers.
 *
 * Keeping formatting in one place means the cart, checkout,
 * orders and profile screens always show the same values in the
 * same way.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 2,
});

function formatCurrency(value) {
  return CURRENCY_FORMATTER.format(Number(value || 0)).replace(/\u00a0/g, " ");
}

function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value) {
  return String(value ?? "")
      .trim()
      .toLowerCase();
}

function initials(value) {
  const parts = String(value || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
}

/* ── Product conditions ───────────────────────────────────── */

const PRODUCT_CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "LIKE_NEW", label: "Like new" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

function conditionLabel(value) {
  const match = PRODUCT_CONDITIONS.find(
      (condition) => condition.value === String(value || "").toUpperCase(),
  );

  return match ? match.label : "Not specified";
}

/* ── Payment methods ──────────────────────────────────────── */

const PAYMENT_METHODS = [
  {
    value: "CREDIT_CARD",
    label: "Credit card",
    hint: "Visa or Mastercard",
  },
  {
    value: "DEBIT_CARD",
    label: "Debit card",
    hint: "Cheque or savings card",
  },
  {
    value: "EFT",
    label: "Bank transfer (EFT)",
    hint: "Pay from your banking app",
  },
  {
    value: "CASH",
    label: "Cash on collection",
    hint: "Pay at the agreed pickup point",
  },
];

function paymentMethodLabel(value) {
  const match = PAYMENT_METHODS.find(
      (method) => method.value === String(value || "").toUpperCase(),
  );

  return match ? match.label : "Not specified";
}

export {
  PAYMENT_METHODS,
  PRODUCT_CONDITIONS,
  conditionLabel,
  formatCurrency,
  formatDate,
  formatDateTime,
  initials,
  normalize,
  paymentMethodLabel,
};
