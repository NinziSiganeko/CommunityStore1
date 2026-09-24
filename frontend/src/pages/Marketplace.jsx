import { useEffect, useState } from "react";
import { Badge, Rating } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { getProducts } from "../services/productService.js";
import { useNavigate } from "react-router-dom";

function Marketplace({ onToast }) {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({ category: false, price: false, condition: false });

  useEffect(() => {
    let active = true;
    getProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch(() => {
        if (active) setError("We couldn't load products. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

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
      {loading && <div className="route-state"><p>Loading products...</p></div>}
      {!loading && error && <div className="route-state"><h1>Marketplace unavailable</h1><p>{error}</p></div>}
      {!loading && !error && products.length === 0 && <div className="route-state"><h1>No products yet</h1><p>Check back soon for new campus listings.</p></div>}
      {!loading && !error && products.length > 0 && <div className="market-grid">{products.map((item, index) =>
        <div key={item.id} className="product-card" onClick={() => navigate(`/product/${item.id}`)} role="link" tabIndex="0">
          <div className="product-img-wrap">
            <img src={item.img} alt={item.name} />
            {item.badge && <span className="badge-img-overlay"><Badge type={item.badge} /></span>}
            <button className="wishlist-btn" onClick={(event) => { event.stopPropagation(); onToast("Added to wishlist ❤️"); }}>
              <i className="bi bi-heart" />
            </button>
          </div>
          <div className="product-body">
            <p className="product-name">{item.name}</p>
            <div className="product-footer">
              <span className="price">{item.price}</span>
              <Rating value={item.rating} />
            </div>
            {index === products.length - 1 && <button className="list-item-btn" onClick={(event) => { event.stopPropagation(); onToast("List an Item — coming in Sprint 3 🛒"); }}>
              <i className="bi bi-plus-lg" />LIST AN ITEM</button>}
          </div>
        </div>
      )}</div>}
      <div style={{ height: 16 }} />
    </div>
    <BottomNav active="market" />
  </div>;
}

export default Marketplace;
