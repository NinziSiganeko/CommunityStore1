const TRENDING_ITEMS = [
  {
    id: 1,
    name: "Ergon Dorm Chair",
    price: "R 4 500.00",
    rating: 4.8,
    badge: "verified",
    img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=300&q=80"
  },
  {
    id: 2,
    name: "CS Essentials Bundle",
    price: "R 120.00",
    rating: 4.9,
    badge: "verified",
    img: "https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=300&q=80"
  },
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    bg: "#DBEAFE",
    tagColor: "#1D4ED8",
    tag: "BOOK SWAP · 14 Aug",
    title: "Weekend Book Swap at Main Quad",
    body: "Bring old semester's books and swap with fellow students. Refreshments provided.",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
      <path strokeLinecap="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>,
  },
  {
    id: 2,
    bg: "#FEF9C3",
    tagColor: "#D97706",
    tag: "TRUST TEAM · 14 Aug",
    title: "Security Update: New Pickup Points",
    body: "Three new verified 24/7 safe exchange zones added near the Student Union.",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2">
      <path strokeLinecap="round" d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>,
  },
  {
    id: 3,
    bg: "#DCFCE7",
    tagColor: "#16A34A",
    tag: "CAMPUS DELIVERY · 14 Aug",
    title: "Campus delivery now active for verified vendors.",
    body: null,
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>,
  },
];

const CATEGORIES = [
  {
    label: "Textbooks",
    bg: "#EFF6FF",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.8">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  },
  {
    label: "Electronics",
    bg: "#F5F3FF",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8">
      <rect x="9" y="9" width="6" height="6" />
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="9" y1="2" x2="9" y2="9" />
      <line x1="15" y1="2" x2="15" y2="9" />
      <line x1="9" y1="15" x2="9" y2="22" />
      <line x1="15" y1="15" x2="15" y2="22" />
    </svg>
  },
  {
    label: "Services",
    bg: "#ECFDF5",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  },
  {
    label: "Vendors",
    bg: "#FFFBEB",
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
      <path d="M3 9l1-6h16l1 6" />
      <path d="M3 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0M5 9v12h14V9" />
    </svg>
  },
];

export { ANNOUNCEMENTS, CATEGORIES, TRENDING_ITEMS };
