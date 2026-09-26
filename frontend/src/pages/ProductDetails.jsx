import { useState } from "react";
import {
  ArrowLeft,
  Search,
  Bell,
  Heart,
  MessageCircle,
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import thaboImg from "../assets/products/Thabo.webp";
import sarah from "../assets/products/Sarah.webp";
export default function ProductDetails() {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [vendorIndex, setVendorIndex] = useState(0);
  const [productIndex, setProductIndex] = useState(0);

  const vendors = [
    {
      name: "Alex Johnson",
      rating: 4.9,
      sales: 124,
      avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      products: [
        {
          id: 1,
          title: "Vintage SLR 35mm Camera",
          price: "R 14,500.00",
          description:
              "Perfect condition vintage 35mm film camera. Recently serviced and fully functional. Includes the original leather case and a 50mm f/1.8 prime lens.",
          tags: ["ELECTRONICS", "PHOTOGRAPHY", "VINTAGE"],
          image:
              "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop",
        },
        {
          id: 2,
          title: "Pro Compact Tripod",
          price: "R 1,500.00",
          description:
              "Lightweight yet sturdy aluminium tripod. Extends up to 160cm and folds down to 40cm. Perfect for travel and campus shoots.",
          tags: ["PHOTOGRAPHY", "ACCESSORIES"],
          image:
              "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=800&fit=crop",
        },
        {
          id: 3,
          title: "35mm Film Pack (3x)",
          price: "R 450.00",
          description:
              "Fresh pack of three 35mm colour film rolls (36 exposures each). ISO 400 – great for everyday shooting and low light.",
          tags: ["PHOTOGRAPHY", "FILM"],
          image:
              "https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=800&fit=crop",
        },
        {
          id: 4,
          title: "Leather Camera Strap",
          price: "R 320.00",
          description:
              "Hand-stitched genuine leather camera strap. Adjustable length, soft padding, and strong metal clips.",
          tags: ["ACCESSORIES", "LEATHER"],
          image:
              "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop",
        },
      ],
    },
    {
      name: "Sarah Nkosi",
      rating: 4.8,
      sales: 89,
      avatar:
      sarah,
      products: [
        {
          id: 5,
          title: "Handmade Birthday Cake",
          price: "R 450.00",
          description:
              "Delicious chocolate birthday cake with custom message. Freshly baked, serves 8–10 people. Perfect for campus celebrations.",
          tags: ["FOOD", "BAKERY", "CUSTOM"],
          image:
              "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop",
        },
        {
          id: 6,
          title: "Cupcake Box (12)",
          price: "R 280.00",
          description:
              "Assorted cupcakes – vanilla, chocolate, red velvet. Beautifully decorated. Ideal for parties or gifts.",
          tags: ["FOOD", "BAKERY"],
          image:
              "https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800&h=800&fit=crop",
        },
        {
          id: 7,
          title: "Chocolate Brownies (8)",
          price: "R 180.00",
          description:
              "Rich, fudgy homemade brownies. Made with real dark chocolate. A student favourite.",
          tags: ["FOOD", "SWEETS"],
          image:
              "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800&h=800&fit=crop",
        },
      ],
    },
    {
      name: "Thabo Molefe",
      rating: 4.7,
      sales: 56,
      avatar:
      thaboImg,
      products: [
        {
          id: 8,
          title: "Ergonomic Office Chair",
          price: "R 4,500.00",
          description:
              "Comfortable mesh office chair with lumbar support. Perfect for long study sessions. Almost new condition.",
          tags: ["FURNITURE", "STUDY"],
          image:
              "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&h=800&fit=crop",
        },
        {
          id: 9,
          title: "Wireless Keyboard",
          price: "R 900.00",
          description:
              "Slim wireless keyboard with quiet keys. Great battery life. Ideal for laptops and desktops.",
          tags: ["ELECTRONICS", "ACCESSORIES"],
          image:
              "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&h=800&fit=crop",
        },
        {
          id: 10,
          title: "Desk Lamp LED",
          price: "R 350.00",
          description:
              "Adjustable LED desk lamp with 3 brightness levels. USB powered. Easy on the eyes for late-night study.",
          tags: ["ELECTRONICS", "STUDY"],
          image:
              "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&h=800&fit=crop",
        },
      ],
    },
  ];

  const seller = vendors[vendorIndex];
  const products = seller.products;
  const product = products[productIndex];

  const goToPrevProduct = () => {
    setProductIndex((prev) => (prev === 0 ? products.length - 1 : prev - 1));
    setIsWishlisted(false);
  };

  const goToNextProduct = () => {
    setProductIndex((prev) => (prev === products.length - 1 ? 0 : prev + 1));
    setIsWishlisted(false);
  };

  const goToProductIndex = (index) => {
    setProductIndex(index);
    setIsWishlisted(false);
  };

  const goToNextVendor = () => {
    const next = (vendorIndex + 1) % vendors.length;
    setVendorIndex(next);
    setProductIndex(0); // start at first product of new vendor
    setIsWishlisted(false);
  };

  const relatedItems = products.filter((_, i) => i !== productIndex);

  return (
      <div className="cs-page">
        {/* Header */}
        <header className="cs-header">
          <button
              className="icon-btn"
              aria-label="Back"
              onClick={() => navigate(-1)}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="title">Community Store</h1>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="icon-btn" aria-label="Search">
              <Search size={20} />
            </button>
            <button className="icon-btn" aria-label="Notifications">
              <Bell size={20} />
            </button>
          </div>
        </header>

        <div className="product-gallery">
          <img src={product.image} alt={product.title} />

          <button
              className="gallery-nav gallery-nav-left"
              onClick={goToPrevProduct}
              aria-label="Previous product"
          >
            <ChevronLeft size={28} />
          </button>
          <button
              className="gallery-nav gallery-nav-right"
              onClick={goToNextProduct}
              aria-label="Next product"
          >
            <ChevronRight size={28} />
          </button>

          <button
              className="wishlist-btn"
              aria-label="Add to wishlist"
              onClick={() => setIsWishlisted(!isWishlisted)}
              style={{ color: isWishlisted ? "#ef4444" : undefined }}
          >
            <Heart size={20} fill={isWishlisted ? "#ef4444" : "none"} />
          </button>

          <div className="gallery-dots">
            {products.map((_, index) => (
                <span
                    key={index}
                    className={index === productIndex ? "active" : ""}
                    onClick={() => goToProductIndex(index)}
                    style={{ cursor: "pointer" }}
                />
            ))}
          </div>
        </div>

        <div className="product-body">
          <div className="product-meta">
          <span className="verified-campus">
            <Check size={12} strokeWidth={3} /> VERIFIED CAMPUS
          </span>
            <div className="product-price">{product.price}</div>
          </div>

          <h1 className="product-title">{product.title}</h1>

          <div className="seller-card-wrap">
            <button
                className="seller-nav-btn"
                onClick={() => {
                  const prev = (vendorIndex - 1 + vendors.length) % vendors.length;
                  setVendorIndex(prev);
                  setProductIndex(0);
                  setIsWishlisted(false);
                }}
                aria-label="Previous vendor"
            >
              ‹
            </button>

            <button className="seller-card" onClick={goToNextVendor}>
              <div className="seller-left">
                <img
                    className="seller-avatar"
                    src={seller.avatar}
                    alt={seller.name}
                />
                <div className="seller-info">
                  <h4>{seller.name}</h4>
                  <div className="rating">
                    <span className="star">★</span>
                    <strong>{seller.rating}</strong>
                    <span style={{ color: "var(--text-muted)" }}>
            ({seller.sales} sales)
          </span>
                  </div>
                </div>
              </div>
              <span className="seller-chevron">›</span>
            </button>
          </div>

          <p className="section-title">Description</p>
          <p className="description">{product.description}</p>

          <div className="tags">
            {product.tags.map((tag) => (
                <span key={tag} className="tag">
              {tag}
            </span>
            ))}
          </div>

          <div className="related-header">
            <h3>More from {seller.name}</h3>
            <button className="view-all" onClick={goToNextProduct}>
              NEXT →
            </button>
          </div>

          <div className="related-scroll">
            {relatedItems.map((item) => {
              const realIndex = products.findIndex((p) => p.id === item.id);
              return (
                  <article
                      key={item.id}
                      className="related-card"
                      onClick={() => goToProductIndex(realIndex)}
                      style={{ cursor: "pointer" }}
                  >
                    <img src={item.image} alt={item.title} />
                    <div className="info">
                      <h4 className="card-title">{item.title}</h4>
                      <p className="price">{item.price}</p>
                    </div>
                  </article>
              );
            })}
          </div>
        </div>

        <div className="action-bar">
          <button
              className="btn-outline"
              onClick={() =>
                  navigate("/message", {
                    state: {
                      seller: seller,
                      productTitle: product.title,
                    },
                  })
              }
          >
            <MessageCircle size={18} /> Message
          </button>
          <button className="btn-buy">
            <ShoppingCart size={18} /> Buy Now
          </button>
        </div>

        <BottomNav />
      </div>
  );
}