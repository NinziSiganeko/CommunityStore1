import { useState } from "react";
import { ArrowLeft, CreditCard, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function PaymentMethods() {
    const navigate = useNavigate();

    const [cards, setCards] = useState([
        {
            id: 1,
            type: "Visa",
            last4: "4242",
            expiry: "08/27",
            isDefault: true,
        },
        {
            id: 2,
            type: "Mastercard",
            last4: "8888",
            expiry: "12/26",
            isDefault: false,
        },
    ]);

    const [showAdd, setShowAdd] = useState(false);
    const [newCard, setNewCard] = useState({
        number: "",
        name: "",
        expiry: "",
        cvv: "",
    });

    const setDefault = (id) => {
        setCards(
            cards.map((c) => ({
                ...c,
                isDefault: c.id === id,
            }))
        );
    };

    const removeCard = (id) => {
        setCards(cards.filter((c) => c.id !== id));
    };

    const handleAdd = () => {
        if (newCard.number.length < 4) return;
        const last4 = newCard.number.slice(-4);
        setCards([
            ...cards,
            {
                id: Date.now(),
                type: newCard.number.startsWith("4") ? "Visa" : "Mastercard",
                last4,
                expiry: newCard.expiry || "—",
                isDefault: cards.length === 0,
            },
        ]);
        setNewCard({ number: "", name: "", expiry: "", cvv: "" });
        setShowAdd(false);
    };

    return (
        <div className="cs-page">
            <header className="cs-header">
                <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={22} />
                </button>
                <h1 className="title">Payment Methods</h1>
                <div style={{ width: 34 }} />
            </header>

            <div className="payments-body">
                <p className="payments-hint">
                    Cards used for purchases on Community Store
                </p>

                {/* Saved cards */}
                <div className="cards-list">
                    {cards.map((card) => (
                        <div
                            key={card.id}
                            className={`payment-card ${card.isDefault ? "default" : ""}`}
                        >
                            <div className="payment-card-left">
                                <div className="card-icon">
                                    <CreditCard size={22} />
                                </div>
                                <div>
                                    <h4>
                                        {card.type} •••• {card.last4}
                                    </h4>
                                    <p>Expires {card.expiry}</p>
                                    {card.isDefault && (
                                        <span className="default-badge">Default</span>
                                    )}
                                </div>
                            </div>
                            <div className="payment-card-actions">
                                {!card.isDefault && (
                                    <button
                                        className="text-btn"
                                        onClick={() => setDefault(card.id)}
                                    >
                                        Set default
                                    </button>
                                )}
                                <button
                                    className="icon-delete"
                                    onClick={() => removeCard(card.id)}
                                    aria-label="Remove card"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add card toggle */}
                {!showAdd ? (
                    <button className="btn-outline add-card-btn" onClick={() => setShowAdd(true)}>
                        <Plus size={18} /> Add Payment Method
                    </button>
                ) : (
                    <div className="add-card-form">
                        <h3>Add new card</h3>

                        <label className="field-label">Card number</label>
                        <input
                            className="field-input"
                            placeholder="1234 5678 9012 3456"
                            value={newCard.number}
                            onChange={(e) =>
                                setNewCard({ ...newCard, number: e.target.value.replace(/\s/g, "") })
                            }
                            maxLength={16}
                        />

                        <label className="field-label">Name on card</label>
                        <input
                            className="field-input"
                            placeholder="Alex Rivera"
                            value={newCard.name}
                            onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                        />

                        <div className="field-row">
                            <div>
                                <label className="field-label">Expiry</label>
                                <input
                                    className="field-input"
                                    placeholder="MM/YY"
                                    value={newCard.expiry}
                                    onChange={(e) =>
                                        setNewCard({ ...newCard, expiry: e.target.value })
                                    }
                                    maxLength={5}
                                />
                            </div>
                            <div>
                                <label className="field-label">CVV</label>
                                <input
                                    className="field-input"
                                    placeholder="123"
                                    value={newCard.cvv}
                                    onChange={(e) =>
                                        setNewCard({ ...newCard, cvv: e.target.value })
                                    }
                                    maxLength={4}
                                />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button className="btn-outline" onClick={() => setShowAdd(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleAdd}>
                                Save Card
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}