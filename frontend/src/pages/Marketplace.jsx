import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import ProductCard from "../components/ProductCard.jsx";
import { Loader, StateMessage } from "../components/Feedback.jsx";
import { getCategories } from "../services/categoryService.js";
import {
    filterProducts,
    getProducts,
} from "../services/productService.js";

import {
    PRODUCT_CONDITIONS,
    conditionLabel,
    formatCurrency,
} from "../utils/format.js";

const SORT_OPTIONS = [
    { value: "newest", label: "Newest first" },
    { value: "price-asc", label: "Price: low to high" },
    { value: "price-desc", label: "Price: high to low" },
    { value: "name-asc", label: "Name: A to Z" },
];

const EMPTY_FILTERS = {
    q: "",
    category: "",
    condition: "",
    sort: "",
    min: "",
    max: "",
};

function Marketplace() {
  const navigate = useNavigate();

    const [searchParams, setSearchParams] = useSearchParams();

    const filters = {
        q: searchParams.get("q") || "",
        category: searchParams.get("category") || "",
        condition: searchParams.get("condition") || "",
        sort: searchParams.get("sort") || "",
        min: searchParams.get("min") || "",
        max: searchParams.get("max") || "",
    };

    const [draft, setDraft] = useState(filters.q);
    const [openPanel, setOpenPanel] = useState(null);
    const [priceDraft, setPriceDraft] = useState({
        min: filters.min,
        max: filters.max,
  });
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /* Merge a patch into the URL so filters can be shared as a link. */
    function updateFilters(patch) {
        const next = {
            ...filters,
            ...patch,
        };

        Object.keys(next).forEach((key) => {
            if (
                next[key] === "" ||
                next[key] === null ||
                next[key] === undefined
            ) {
                delete next[key];
            }
        });

        setSearchParams(next, {
            replace: true,
        });
    }

  useEffect(() => {
    let active = true;

      Promise.allSettled([getProducts(), getCategories()])
          .then(([productsResult, categoriesResult]) => {
              if (!active) {
                  return;
              }

              if (productsResult.status === "fulfilled") {
                  setProducts(productsResult.value);
              } else {
            setError(
                "We couldn't load products. Please try again.",
            );
          }
              if (categoriesResult.status === "fulfilled") {
                  setCategories(
                      Array.isArray(categoriesResult.value)
                          ? categoriesResult.value
                          : [],
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

    /* Keep the input in step when the query string changes elsewhere. */
    useEffect(() => {
        setDraft(filters.q);
    }, [filters.q]);

    /* Debounced search: typing updates ?q= after a short pause. */
    useEffect(() => {
        if (draft === filters.q) {
            return undefined;
        }

        const timer = setTimeout(() => {
            updateFilters({ q: draft });
        }, 350);

        return () => clearTimeout(timer);
    }, [draft]);

    useEffect(() => {
        setPriceDraft({
            min: filters.min,
            max: filters.max,
        });
    }, [filters.min, filters.max]);

    const filteredProducts = useMemo(
        () =>
            filterProducts(products, {
                q: filters.q,
                category: filters.category,
                condition: filters.condition,
                sort: filters.sort,
                minPrice: filters.min,
                maxPrice: filters.max,
            }),
        [products, filters.q, filters.category, filters.condition, filters.sort, filters.min, filters.max],
    );

    const hasFilters = Boolean(
        filters.q ||
        filters.category ||
        filters.condition ||
        filters.sort ||
        filters.min ||
        filters.max,
    );

    function clearAll() {
        setDraft("");
        setPriceDraft({ min: "", max: "" });
        setOpenPanel(null);
        setSearchParams({}, { replace: true });
    }

    function togglePanel(panel) {
        setOpenPanel((current) => (current === panel ? null : panel));
    }

    function applyPrice() {
        updateFilters({
            min: priceDraft.min,
            max: priceDraft.max,
        });

        setOpenPanel(null);
    }

    const activeFilterCount = [
        filters.category,
        filters.condition,
        filters.sort,
        filters.min || filters.max,
    ].filter(Boolean).length;

  return (
      <div className="screen">
          <TopBar onBell={() => navigate("/notifications")} />

          <div className="market-toolbar">
              <div className="search-bar market-search">
                  <i className="bi bi-search" />

                  <input
                      className="search-input"
                      type="search"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Search listings, categories or sellers..."
                      aria-label="Search listings"
                  />

                  {draft && (
                      <button
                          type="button"
                          className="search-clear"
                          onClick={() => setDraft("")}
                          aria-label="Clear search"
                      >
                          <i className="bi bi-x-circle-fill" />
                      </button>
                  )}
              </div>
          </div>

        <div className="filter-bar">
          <i
              className="bi bi-funnel"
              style={{
                flexShrink: 0,
              }}
          />

            <button
                type="button"
                className={`filter-chip ${filters.category ? "active" : ""}`}
                onClick={() => togglePanel("category")}
            >
                {filters.category || "Category"}
                <i className="bi bi-chevron-down" />
            </button>

            <button
                type="button"
                className={`filter-chip ${filters.min || filters.max ? "active" : ""}`}
                onClick={() => togglePanel("price")}
            >
                {filters.min || filters.max
                    ? `${formatCurrency(filters.min || 0)} – ${
                        filters.max ? formatCurrency(filters.max) : "any"
                    }`
                    : "Price"}
                <i className="bi bi-chevron-down" />
            </button>

            <button
                type="button"
                className={`filter-chip ${filters.condition ? "active" : ""}`}
                onClick={() => togglePanel("condition")}
            >
                {filters.condition
                    ? conditionLabel(filters.condition)
                    : "Condition"}
                <i className="bi bi-chevron-down" />
            </button>

            <button
                type="button"
                className={`filter-chip ${filters.sort ? "active" : ""}`}
                onClick={() => togglePanel("sort")}
            >
                {SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ||
                    "Sort"}
                <i className="bi bi-chevron-down" />
            </button>

            {hasFilters && (
                <button
                    type="button"
                    className="filter-chip ghost"
                    onClick={clearAll}
                >
                    <i className="bi bi-x-lg" />
                    Reset
                </button>
            )}
        </div>

          {openPanel && (
              <>
                  <div
                      className="filter-backdrop"
                      onClick={() => setOpenPanel(null)}
                      role="presentation"
                  />

                  <div className="filter-panel">
                      {openPanel === "category" && (
                          <>
                              <p className="filter-panel-title">Category</p>

                              <button
                                  type="button"
                                  className={`filter-option ${!filters.category ? "selected" : ""}`}
                                  onClick={() => {
                                      updateFilters({ category: "" });
                                      setOpenPanel(null);
                                  }}
                              >
                                  All categories
                              </button>

                              {categories.map((category) => (
                                  <button
                                      type="button"
                                      key={category.categoryId}
                                      className={`filter-option ${
                                          filters.category === category.categoryName
                                              ? "selected"
                                              : ""
                                      }`}
                                      onClick={() => {
                                          updateFilters({
                                              category: category.categoryName,
                                          });
                                          setOpenPanel(null);
                                      }}
                                  >
                                      {category.categoryName}
                                  </button>
                              ))}

                              <button
                                  type="button"
                                  className={`filter-option ${
                                      filters.category === "Vendors" ? "selected" : ""
                                  }`}
                                  onClick={() => {
                                      updateFilters({ category: "Vendors" });
                                      setOpenPanel(null);
                                  }}
                              >
                                  Vendor listings
                              </button>
                          </>
                      )}

                      {openPanel === "price" && (
                          <>
                              <p className="filter-panel-title">Price range (ZAR)</p>

                              <div className="filter-price-row">
                                  <label>
                                      Minimum
                                      <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={priceDraft.min}
                                          onChange={(event) =>
                                              setPriceDraft((previous) => ({
                                                  ...previous,
                                                  min: event.target.value,
                                              }))
                                          }
                                          placeholder="0"
                                      />
                                  </label>

                                  <label>
                                      Maximum
                                      <input
                                          type="number"
                                          min="0"
                                          step="1"
                                          value={priceDraft.max}
                                          onChange={(event) =>
                                              setPriceDraft((previous) => ({
                                                  ...previous,
                                                  max: event.target.value,
                                              }))
                                          }
                                          placeholder="Any"
                                      />
                                  </label>
                              </div>

                              <div className="filter-panel-actions">
                                  <button
                                      type="button"
                                      className="ghost-btn"
                                      onClick={() => {
                                          setPriceDraft({ min: "", max: "" });
                                          updateFilters({ min: "", max: "" });
                                      }}
                                  >
                                      Clear
                                  </button>

                                  <button
                                      type="button"
                                      className="primary-action small"
                                      onClick={applyPrice}
                                  >
                                      Apply
                                  </button>
                              </div>
                          </>
                      )}

                      {openPanel === "condition" && (
                          <>
                              <p className="filter-panel-title">Condition</p>

                              <button
                                  type="button"
                                  className={`filter-option ${!filters.condition ? "selected" : ""}`}
                                  onClick={() => {
                                      updateFilters({ condition: "" });
                                      setOpenPanel(null);
                                  }}
                              >
                                  Any condition
                              </button>

                              {PRODUCT_CONDITIONS.map((condition) => (
                                  <button
                                      type="button"
                                      key={condition.value}
                                      className={`filter-option ${
                                          filters.condition === condition.value
                                              ? "selected"
                                              : ""
                                      }`}
                                      onClick={() => {
                                          updateFilters({
                                              condition: condition.value,
                                          });
                                          setOpenPanel(null);
                                      }}
                                  >
                                      {condition.label}
                                  </button>
                              ))}
                          </>
                      )}

                      {openPanel === "sort" && (
                          <>
                              <p className="filter-panel-title">Sort listings</p>

                              <button
                                  type="button"
                                  className={`filter-option ${!filters.sort ? "selected" : ""}`}
                                  onClick={() => {
                                      updateFilters({ sort: "" });
                                      setOpenPanel(null);
                                  }}
                              >
                                  Newest first
                              </button>

                              {SORT_OPTIONS.map((option) => (
                                  <button
                                      type="button"
                                      key={option.value}
                                      className={`filter-option ${
                                          filters.sort === option.value ? "selected" : ""
                                      }`}
                                      onClick={() => {
                                          updateFilters({ sort: option.value });
                                          setOpenPanel(null);
                                      }}
                                  >
                                      {option.label}
                                  </button>
                              ))}
                          </>
                      )}
                  </div>
              </>
          )}

          <div className="market-summary">
              <strong>
                  {filteredProducts.length}
              </strong>{" "}
              {filteredProducts.length === 1 ? "listing" : "listings"}

              {hasFilters && (
                  <>
                      <span className="market-summary-sep">·</span>
                      <span className="market-summary-active">
              {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`
                  : "Filtered by search"}
            </span>
                  </>
              )}
          </div>

          <div className="market-grid-wrap">
              {loading && <Loader label="Loading listings..." />}

              {!loading && error && (
                  <StateMessage
                      tone="error"
                      icon="bi-wifi-off"
                      title="Marketplace unavailable"
                      message={error}
                      actionLabel="Try again"
                      onAction={() => window.location.reload()}
                  />
              )}

              {!loading && !error && filteredProducts.length === 0 && (
                  <StateMessage
                      icon="bi-box-seam"
                      title={
                          filters.category
                              ? `No ${filters.category.toLowerCase()} listings`
                              : "No listings match your search"
                      }
                      message={
                          hasFilters
                              ? "Try a different search term or clear the filters to see everything."
                              : "Check back soon for new community listings."
                      }
                      actionLabel={hasFilters ? "Clear filters" : undefined}
                      onAction={hasFilters ? clearAll : undefined}
                  />
              )}

              {!loading && !error && filteredProducts.length > 0 && (
                  <div className="market-grid">
                      {filteredProducts.map((item) => (
                          <ProductCard key={item.id} product={item} stockLabel />
                      ))}
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