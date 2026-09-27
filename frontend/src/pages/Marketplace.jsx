import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  Badge,
  Rating,
} from "../components/Icons.jsx";

import {
  BottomNav,
  TopBar,
} from "../components/Navigation.jsx";

import {
  getProducts,
} from "../services/productService.js";

function normalize(value) {
  return String(value || "")
      .trim()
      .toLowerCase();
}

function Marketplace({ onToast }) {
  const navigate = useNavigate();

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const selectedCategory =
      searchParams.get("category") || "";

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState(null);

  const [
    activeFilters,
    setActiveFilters,
  ] = useState({
    category: false,
    price: false,
    condition: false,
  });

  useEffect(() => {
    let active = true;

    getProducts()
        .then((items) => {
          if (active) {
            setProducts(items);
          }
        })
        .catch(() => {
          if (active) {
            setError(
                "We couldn't load products. Please try again.",
            );
          }
        })
        .finally(() => {
          if (active) {
            setLoading(false);
          }
        });

    return () => {
      active = false;
    };
  }, []);

  function toggleFilter(key) {
    setActiveFilters(
        (previous) => ({
          ...previous,
          [key]: !previous[key],
        }),
    );
  }

  function clearCategory() {
    setSearchParams({});
  }

  const filteredProducts =
      selectedCategory
          ? products.filter((product) => {
            /*
             * Vendors is not a product category.
             * It means products sold by users whose
             * account type is VENDOR.
             */
            if (
                normalize(
                    selectedCategory,
                ) === "vendors"
            ) {
              return (
                  normalize(
                      product.sellerUserType,
                  ) === "vendor"
              );
            }

            return (
                normalize(
                    product.category,
                ) ===
                normalize(
                    selectedCategory,
                )
            );
          })
          : products;

  return (
      <div className="screen">
        <TopBar
            onBell={() =>
                onToast(
                    "No new notifications",
                )
            }
        />

        <div className="filter-bar">
          <i
              className="bi bi-funnel"
              style={{
                flexShrink: 0,
              }}
          />

          {[
            "category",
            "price",
            "condition",
          ].map((key) => (
              <button
                  key={key}
                  className={`filter-chip ${
                      activeFilters[key]
                          ? "active"
                          : ""
                  }`}
                  onClick={() =>
                      toggleFilter(key)
                  }
              >
                {key
                        .charAt(0)
                        .toUpperCase() +
                    key.slice(1)}

                <i className="bi bi-chevron-down" />
              </button>
          ))}
        </div>

        {selectedCategory && (
            <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                      "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  background: "#EFF6FF",
                  borderBottom:
                      "1px solid #DBEAFE",
                }}
            >
              <div>
            <span
                style={{
                  display: "block",
                  color: "#64748B",
                  fontSize: 11,
                }}
            >
              Showing
            </span>

                <strong
                    style={{
                      color: "#1E3A8A",
                      fontSize: 14,
                    }}
                >
                  {selectedCategory}
                </strong>
              </div>

              <button
                  onClick={clearCategory}
                  style={{
                    border: 0,
                    background:
                        "transparent",
                    color: "#2563EB",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
              >
                CLEAR
              </button>
            </div>
        )}

        <div className="market-grid-wrap">
          {loading && (
              <div className="route-state">
                <p>
                  Loading products...
                </p>
              </div>
          )}

          {!loading && error && (
              <div className="route-state">
                <h1>
                  Marketplace unavailable
                </h1>

                <p>{error}</p>
              </div>
          )}

          {!loading &&
              !error &&
              filteredProducts.length ===
              0 && (
                  <div className="route-state">
                    <i className="bi bi-box-seam" />

                    <h1>
                      {selectedCategory
                          ? `No ${selectedCategory.toLowerCase()} listings`
                          : "No products yet"}
                    </h1>

                    <p>
                      {selectedCategory
                          ? "There are no active listings in this category yet."
                          : "Check back soon for new community listings."}
                    </p>

                    {selectedCategory && (
                        <button
                            className="primary-action"
                            onClick={
                              clearCategory
                            }
                        >
                          View All Products
                        </button>
                    )}
                  </div>
              )}

          {!loading &&
              !error &&
              filteredProducts.length >
              0 && (
                  <div className="market-grid">
                    {filteredProducts.map(
                        (item, index) => (
                            <div
                                key={item.id}
                                className="product-card"
                                onClick={() =>
                                    navigate(
                                        `/product/${item.id}`,
                                    )
                                }
                                role="link"
                                tabIndex="0"
                            >
                              <div className="product-img-wrap">
                                <img
                                    src={item.img}
                                    alt={item.name}
                                />

                                {item.badge && (
                                    <span className="badge-img-overlay">
                          <Badge
                              type={
                                item.badge
                              }
                          />
                        </span>
                                )}

                                <button
                                    className="wishlist-btn"
                                    onClick={(
                                        event,
                                    ) => {
                                      event.stopPropagation();

                                      onToast(
                                          "Added to wishlist ❤️",
                                      );
                                    }}
                                >
                                  <i className="bi bi-heart" />
                                </button>
                              </div>

                              <div className="product-body">
                                <p className="product-name">
                                  {item.name}
                                </p>

                                <div className="product-footer">
                        <span className="price">
                          {item.price}
                        </span>

                                  <Rating
                                      value={
                                        item.rating
                                      }
                                  />
                                </div>

                                {index ===
                                    filteredProducts.length -
                                    1 && (
                                        <button
                                            className="list-item-btn"
                                            onClick={(
                                                event,
                                            ) => {
                                              event.stopPropagation();

                                              navigate(
                                                  "/sell",
                                              );
                                            }}
                                        >
                                          <i className="bi bi-plus-lg" />
                                          LIST AN ITEM
                                        </button>
                                    )}
                              </div>
                            </div>
                        ),
                    )}
                  </div>
              )}

          <div
              style={{
                height: 16,
              }}
          />
        </div>

        <BottomNav active="market" />
      </div>
  );
}

export default Marketplace;