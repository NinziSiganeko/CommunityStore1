const CURRENCY_FORMATTER = new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
});

function formatCurrency(value) {
    return CURRENCY_FORMATTER
        .format(Number(value || 0))
        .replace(/\u00a0/g, " ");
}

function formatDate(value) {
    if (!value) return "Date unavailable";

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
    if (!value) return "Date unavailable";

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
    return String(value ?? "").trim().toLowerCase();
}

function initials(value) {
    const parts = String(value || "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 0) return "U";

    return parts
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

const PRODUCT_CONDITIONS = [
    { value: "NEW", label: "New" },
    { value: "LIKE_NEW", label: "Like new" },
    { value: "GOOD", label: "Good" },
    { value: "FAIR", label: "Fair" },
];

function conditionLabel(value) {
    const match = PRODUCT_CONDITIONS.find(
        (condition) =>
            condition.value === String(value || "").toUpperCase(),
    );

    return match ? match.label : "Not specified";
}

/*
 * These are the offline payment methods we can honestly support
 * in the current version.
 *
 * Card payments must remain unavailable until a payment gateway
 * is configured and its payment confirmation is verified.
 */
const PAYMENT_METHODS = [
    {
        value: "CASH",
        label: "Cash at meetup",
        hint: "Pay in person at the agreed collection point.",
    },
    {
        value: "EFT",
        label: "EFT directly to seller",
        hint: "Arrange the transfer after the seller confirms.",
    },
];

/*
 * Keep labels for older orders, but do not offer the older online
 * methods in the checkout selection until they are integrated.
 */
const PAYMENT_METHOD_LABELS = {
    CASH: "Cash at meetup",
    EFT: "EFT directly to seller",
    BANK_TRANSFER: "Bank transfer",
    CREDIT_CARD: "Credit card",
    DEBIT_CARD: "Debit card",
    PAYPAL: "PayPal",
    APPLE_PAY: "Apple Pay",
    GOOGLE_PAY: "Google Pay",
};

function paymentMethodLabel(value) {
    const key = String(value || "").toUpperCase();

    return PAYMENT_METHOD_LABELS[key] || "Not specified";
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