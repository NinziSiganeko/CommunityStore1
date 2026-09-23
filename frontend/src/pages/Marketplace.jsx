import { useState } from "react";
import { PRODUCTS } from "../utils/data.jsx";
import { Badge, Rating } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";

function Marketplace({ onNav, onToast }) {
  const [activeFilters, setActiveFilters] = useState({ category: false, price: false, condition: false });
  function toggleFilter(key) {
    setActiveFilters((previous) => ({ ...previous, [key]: !previous[key] }));
  }

  return <div className="screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="filter-bar">
      <i className="bi bi-funnel" style={{ flexShrink: 0 }} />{["category", "price", "condition"].map((key) =>
        <button key={key} className={`filter-chip ${activeFilters[key] ? "active" : ""}`} onClick={() => toggleFilter(key)}>
          {key.charAt(0).toUpperCase() + key.slice(1)}
          <i className="bi bi-chevron-down" />
        </button>)}
    </div>
    <div className="market-grid-wrap">
      <div className="market-grid">{PRODUCTS.map((item, index) =>
          <div key={item.id} className="product-card">
            <div className="product-img-wrap">
              <img src={item.img} alt={item.name} />
              {item.badge && <span className="badge-img-overlay">
                <Badge type={item.badge} />
              </span>}
              <button className="wishlist-btn" onClick={(event) => { event.stopPropagation(); onToast("Added to wishlist ❤️"); }}>
                <i className="bi bi-heart" />
              </button>
            </div>
            <div className="product-body">
              <p className="product-name">{item.name}</p>
              <div className="product-footer">
                <span className="price">{item.price}</span>
                <Rating value={item.rating} />
              </div>{index === PRODUCTS.length - 1 && <button className="list-item-btn" onClick={(event) => { event.stopPropagation(); onToast("List an Item — coming in Sprint 3 🛒"); }}>
              <i className="bi bi-plus-lg" />LIST AN ITEM</button>}
            </div>
          </div>
      )}
      </div>
      <div style={{ height: 16 }} />
    </div>
    <BottomNav active="market" onNav={onNav} />
  </div>;
}

export default Marketplace;
