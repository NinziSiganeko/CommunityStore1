import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { createProduct } from "../services/productService.js";
import { getCategories } from "../services/categoryService.js";
import { getCurrentUser, isAuthenticated } from "../services/authService.js";

const INITIAL_FORM = {
    name: "",
    price: "",
    stock: "1",
    categoryName: "",
    productImage: null,
};

function Sell({ onToast }) {
    const navigate = useNavigate();
    const [form, setForm] = useState(INITIAL_FORM);
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const user = getCurrentUser();

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate("/login", { replace: true, state: { from: "/sell" } });
            return;
        }

        getCategories()
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]))
            .finally(() => setLoadingCategories(false));
    }, [navigate]);

    function updateField(event) {
        const { name, value, files } = event.target;

        if (name === "productImage") {
            setForm((previous) => ({ ...previous, productImage: files?.[0] || null }));
            return;
        }

        setForm((previous) => ({ ...previous, [name]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setError(null);

        const price = Number(form.price);
        const stock = Number(form.stock);

        if (!form.name.trim() || !form.categoryName.trim()) {
            setError("Please provide a product name and category.");
            return;
        }

        if (!Number.isFinite(price) || price <= 0) {
            setError("Price must be greater than R0.00.");
            return;
        }

        if (!Number.isInteger(stock) || stock < 0) {
            setError("Stock quantity must be a whole number of 0 or more.");
            return;
        }

        if (form.productImage && form.productImage.size > 10 * 1024 * 1024) {
            setError("Product images must be 10 MB or smaller.");
            return;
        }

        setSubmitting(true);

        try {
            await createProduct({
                name: form.name,
                price,
                stock,
                categoryName: form.categoryName,
                productImage: form.productImage,
            });

            setForm(INITIAL_FORM);
            onToast("Your item has been listed successfully.");
            navigate("/marketplace", { replace: true });
        } catch (requestError) {
            if (requestError.response?.status === 401) {
                setError("Your session has expired. Please sign in again.");
                return;
            }

            if (requestError.response?.status === 403) {
                setError("Your account is not currently allowed to create listings.");
                return;
            }

            setError(
                requestError.response?.data?.message ||
                "We couldn't create the listing. Please try again.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return <div className="screen">
        <TopBar onBell={() => onToast("No new notifications")} />

        <div className="scroll-area route-content sell-content">
            <div className="sell-header">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <i className="bi bi-arrow-left" /> Back
                </button>
                <h1>Sell on Community Store</h1>
                <p>List an item for fellow students, faculty, vendors and residents.</p>
            </div>

            <div className="seller-summary">
                <i className="bi bi-person-circle" />
                <span>Listing as <strong>{user?.displayName || user?.username || "Community seller"}</strong></span>
            </div>

            <form className="sell-form" onSubmit={submit} encType="multipart/form-data">
                <label>
                    Product name
                    <input name="name" value={form.name} onChange={updateField} placeholder="e.g. Second-hand textbook" maxLength="150" required disabled={submitting} />
                </label>

                <div className="form-row">
                    <label>
                        Price (ZAR)
                        <input name="price" type="number" min="0.01" step="0.01" value={form.price} onChange={updateField} placeholder="0.00" required disabled={submitting} />
                    </label>
                    <label>
                        Quantity available
                        <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={updateField} required disabled={submitting} />
                    </label>
                </div>

                <label>
                    Category
                    <input
                        name="categoryName"
                        value={form.categoryName}
                        onChange={updateField}
                        list="community-store-categories"
                        placeholder="e.g. Textbooks"
                        maxLength="100"
                        required
                        disabled={submitting}
                    />
                    <datalist id="community-store-categories">
                        {categories.map((category) => (
                            <option key={category.categoryId} value={category.categoryName} />
                        ))}
                        <option value="Textbooks" />
                        <option value="Electronics" />
                        <option value="Clothing" />
                        <option value="Dorm Essentials" />
                        <option value="Food" />
                        <option value="Services" />
                        <option value="Other" />
                    </datalist>
                    <small>
                        {loadingCategories
                            ? "Loading existing categories..."
                            : "Choose an existing category or type a new one."}
                    </small>
                </label>

                <label>
                    Product image
                    <input name="productImage" type="file" accept="image/*" onChange={updateField} disabled={submitting} />
                    <small>Optional. Maximum file size: 10 MB.</small>
                </label>

                {error && <p className="form-error">{error}</p>}

                <button className="primary-action auth-submit" type="submit" disabled={submitting}>
                    {submitting ? "Publishing listing..." : "Publish Listing"}
                </button>
            </form>
        </div>

        <BottomNav active="sell" />
    </div>;
}

export default Sell;
