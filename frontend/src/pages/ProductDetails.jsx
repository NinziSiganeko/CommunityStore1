import { useNavigate, useParams } from "react-router-dom";
import { Badge, Rating } from "../components/Icons.jsx";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { PRODUCTS } from "../utils/data.jsx";

function ProductDetails({ onToast }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const product = PRODUCTS.find((item) => String(item.id) === id);

  if (!product) {
    return <div className="screen"><TopBar onBell={() => onToast("No new notifications")} /><div className="route-state"><h1>Product not found</h1><button onClick={() => navigate("/marketplace")}>Back to marketplace</button></div></div>;
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
        <p>Verified campus seller listing. Arrange a safe exchange point or campus delivery after checkout.</p>
        <button className="primary-action" onClick={() => onToast("Added to cart")}>Add to cart</button>
      </div>
    </div>
    <BottomNav />
  </div>;
}

export default ProductDetails;
