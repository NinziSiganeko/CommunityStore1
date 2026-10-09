/**
 * Shared display helpers.
 *
 * Keeping formatting in one place means the cart, checkout,
 * orders, chat and profile screens always show the same values in
 * the same way.
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

/* ── Campus Safe Exchange Zones & Banks ───────────────────── */

const SAFE_EXCHANGE_ZONES = [
    {
        id: "student-union",
        label: "Student Union 24/7 Safe Zone",
        address: "Student Union 24/7 Safe Zone (CCTV & Campus Security Desk)",
        tag: "24/7 CCTV · Security Guarded",
    },
    {
        id: "main-library",
        label: "Main Library Foyer Desk",
        address: "Main Library Entrance Foyer, Ground Floor",
        tag: "07:00–22:00 · Student Card Access",
    },
    {
        id: "eng-quad",
        label: "Engineering Quad Security Post",
        address: "Engineering Quad Security Booth, Upper Campus",
        tag: "24/7 Patrol Point",
    },
    {
        id: "campus-traders",
        label: "Campus Traders Court (Shop 4)",
        address: "Campus Traders Court, Shop 4, Main Quad",
        tag: "Verified Vendor Pickup Hub",
    },
    {
        id: "res-block-b",
        label: "Residence Block B Reception",
        address: "12 Campus Road, Residence Block B, Front Desk",
        tag: "Residence Warden Desk",
    },
];

const SA_BANKS = [
    { id: "CAPITEC", name: "Capitec Pay", branchCode: "470010" },
    { id: "FNB", name: "FNB / FirstRand", branchCode: "250655" },
    { id: "STANDARD", name: "Standard Bank", branchCode: "051001" },
    { id: "ABSA", name: "Absa Bank", branchCode: "632005" },
    { id: "NEDBANK", name: "Nedbank", branchCode: "198765" },
    { id: "TYME", name: "TymeBank", branchCode: "678910" },
];

/* ── Payment methods ──────────────────────────────────────── */

const PAYMENT_METHODS = [
    {
        value: "CASH",
        label: "Cash on Meetup",
        shortLabel: "Cash on Meetup",
        icon: "bi-cash-coin",
        badge: "Pay in person",
        hint: "Agree on a campus meetup with the seller, inspect the item and pay in person.",
    },
    {
        value: "EFT",
        label: "EFT arranged with seller",
        shortLabel: "EFT",
        icon: "bi-bank",
        badge: "Recorded as pending",
        hint: "Arrange an EFT directly with the seller. Payment remains pending until it is verified.",
    },
];

const LEGACY_METHOD_LABELS = {
    DEBIT_CARD: "Debit Card",
    BANK_TRANSFER: "Bank Transfer (EFT)",
    PAYPAL: "PayPal",
    APPLE_PAY: "Apple Pay",
    GOOGLE_PAY: "Google Pay",
};

function paymentMethodLabel(value) {
    const key = String(value || "").toUpperCase();
    const match = PAYMENT_METHODS.find((method) => method.value === key);

    if (match) {
        return match.label;
    }

    return LEGACY_METHOD_LABELS[key] || "Not specified";
}

function payoutTypeLabel(payoutType, sellerType) {
    const key = String(payoutType || "").toUpperCase();

    if (key === "DIRECT_ON_MEETUP") {
        return "Payment arranged directly with seller at meetup";
    }

    return sellerType
        ? "Payment arranged directly between buyer and seller"
        : "Payment method not yet confirmed";
}

export {
    PAYMENT_METHODS,
    PRODUCT_CONDITIONS,
    SAFE_EXCHANGE_ZONES,
    SA_BANKS,
    conditionLabel,
    formatCurrency,
    formatDate,
    formatDateTime,
    initials,
    normalize,
    paymentMethodLabel,
    payoutTypeLabel,
};