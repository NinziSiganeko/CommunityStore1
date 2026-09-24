import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Badge, Rating } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { getProductById } from "../services/productService.js";

function ProductDetails({ onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    getProductById(id)
      .then((item) => {
        if (active) setProduct(item);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.status === 404
            ? "Product not found"
            : "We couldn't load this product. Please try again.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading || error || !product) {
    return <div className="screen"><TopBar onBell={() => onToast("No new notifications")} /><div className="route-state">
      <h1>{loading ? "Loading product..." : error || "Product not found"}</h1>
      {!loading && <button onClick={() => navigate("/marketplace")}>Back to marketplace</button>}
    </div></div>;
  }

  return <div className="screen">
    <TopBar onBell={() => onToast("No new notifications")} />
    <div className="scroll-area route-content">
      <button className="back-button" onClick={() => navigate(-1)}><i className="bi bi-arrow-left" /> Back</button>
      <img className="product-detail-image" src={product.img} alt={product.name} />
      <div className="product-detail-body">
        {product.badge && <Badge type={product.badge} />}
        <h1>{product.name}</h1>
        <div className="product-detail-meta"><strong>{product.price}</strong><Rating value={product.rating} /></div>
        <div className="product-detail-info">
          <div><span>Category</span><strong>{product.category || "Uncategorized"}</strong></div>
          <div><span>Seller</span><strong>{product.seller || "Community seller"}</strong></div>
          <div><span>Availability</span><strong className={product.stock > 0 ? "in-stock" : "out-of-stock"}>
            {product.stock > 0 ? `${product.stock} available` : "Out of stock"}
          </strong></div>
        </div>
        <p>Arrange a safe exchange point or campus delivery with the seller after checkout.</p>
        <button className="primary-action" disabled={product.stock < 1} onClick={() => onToast("Added to cart")}>
          {product.stock > 0 ? "Add to cart" : "Out of stock"}
        </button>
      </div>
    </div>
    <BottomNav />
  </div>;
}

export default ProductDetails;
