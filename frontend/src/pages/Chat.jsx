import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { BottomNav, TopBar } from "../components/Navigation.jsx";
import { Banner, Loader } from "../components/Feedback.jsx";

import { useCart } from "../context/CartContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

import { getCurrentUser } from "../services/authService.js";
import {
    buildConversations,
    getMessagesForUser,
    markConversationRead,
    sendMessage,
} from "../services/chatService.js";
import { getProductById } from "../services/productService.js";

import {
    PAYMENT_METHODS,
    SAFE_EXCHANGE_ZONES,
    formatCurrency,
    formatDateTime,
    initials,
    paymentMethodLabel,
} from "../utils/format.js";

const QUICK_REPLIES = [
    "Hi! Is this still available?",
    "Can I pay Cash on Meetup at the Student Union Safe Zone?",
    "Would you prefer cash at meetup or an EFT arranged directly?",
    "Let's agree on a safe public meetup and payment details.",
    "When on campus suits you for collection?",
];

function Chat() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addItem, has } = useCart();
    const { showToast } = useToast();

    const user = getCurrentUser();

    const paramSellerId = Number(searchParams.get("sellerId") || 0);
    const paramSellerName = searchParams.get("sellerName") || "";
    const paramSellerRole = searchParams.get("sellerRole") || "STUDENT";
    const paramProductId = Number(searchParams.get("productId") || 0);
    const paramOrderId = Number(searchParams.get("orderId") || 0);
    const paramOrderNumber = searchParams.get("orderNumber") || "";
    const paramPrompt = searchParams.get("prompt") || "";

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activePartnerId, setActivePartnerId] = useState(
        paramSellerId > 0 && paramSellerId !== Number(user?.userId)
            ? paramSellerId
            : null,
    );
    const [contextProduct, setContextProduct] = useState(null);
    const [draft, setDraft] = useState(paramPrompt);
    const [sending, setSending] = useState(false);

    /* Payment & Meetup proposal builder state */
    const [showProposalBar, setShowProposalBar] = useState(false);
    const [proposedMethod, setProposedMethod] = useState("CASH");
    const [proposedMeetup, setProposedMeetup] = useState(
        SAFE_EXCHANGE_ZONES[0].label,
    );

    const messagesEndRef = useRef(null);

    const loadMessages = useCallback(async (silent = false) => {
        if (!user?.userId) {
            setLoading(false);
            return;
        }

        if (!silent) {
            setLoading(true);
        }

        try {
            const list = await getMessagesForUser(user.userId);
            setMessages(list);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [user?.userId]);

    useEffect(() => {
        loadMessages(false);
    }, [loadMessages]);

    /* Load context product when arriving from a listing or order. */
    useEffect(() => {
        if (!paramProductId) {
            return undefined;
        }

        let active = true;

        getProductById(paramProductId)
            .then((product) => {
                if (!active) {
                    return;
                }
                setContextProduct(product);
                if (
                    product.sellerUserId &&
                    Number(product.sellerUserId) !== Number(user?.userId)
                ) {
                    setActivePartnerId((prev) => prev ?? Number(product.sellerUserId));
                }
            })
            .catch(() => {
                // Ignore missing product
            });

        return () => {
            active = false;
        };
    }, [paramProductId, user?.userId]);

    const conversations = useMemo(() => {
        const built = buildConversations(messages, user?.userId);

        /*
         * If the user just clicked "Message Seller" on a listing whose
         * seller has no messages with them yet, inject a fresh thread header
         * so they can start typing immediately.
         */
        const targetId =
            paramSellerId ||
            (contextProduct?.sellerUserId ? Number(contextProduct.sellerUserId) : 0);

        if (
            targetId > 0 &&
            targetId !== Number(user?.userId) &&
            !built.some((c) => c.partnerId === targetId)
        ) {
            built.unshift({
                partnerId: targetId,
                partnerName:
                    paramSellerName || contextProduct?.seller || `Seller #${targetId}`,
                partnerRole:
                    paramSellerRole || contextProduct?.sellerUserType || "STUDENT",
                isCommunity: false,
                messages: [],
                unreadCount: 0,
                lastMessage: null,
                latestProduct: contextProduct
                    ? {
                        productId: contextProduct.id,
                        productName: contextProduct.name,
                        productPrice: contextProduct.priceValue,
                        productPriceFormatted: contextProduct.price,
                    }
                    : null,
                latestOrder: paramOrderId
                    ? {
                        orderId: paramOrderId,
                        orderNumber: paramOrderNumber || `Order #${paramOrderId}`,
                    }
                    : null,
                latestProposal: null,
            });
        }

        return built;
    }, [
        messages,
        user?.userId,
        paramSellerId,
        paramSellerName,
        paramSellerRole,
        paramOrderId,
        paramOrderNumber,
        contextProduct,
    ]);

    /* Pick the initial active conversation when none is selected yet. */
    useEffect(() => {
        if (activePartnerId !== null) {
            return;
        }

        if (conversations.length > 0) {
            setActivePartnerId(conversations[0].partnerId);
        }
    }, [activePartnerId, conversations]);

    const activeThread = useMemo(
        () =>
            conversations.find((c) => c.partnerId === activePartnerId) ||
            conversations[0] ||
            null,
        [conversations, activePartnerId],
    );

    /* Mark unread messages in the active conversation as read. */
    useEffect(() => {
        if (
            !user?.userId ||
            !activeThread ||
            activeThread.isCommunity ||
            activeThread.unreadCount === 0
        ) {
            return;
        }

        markConversationRead(user.userId, activeThread.partnerId).then(() => {
            setMessages((prev) =>
                prev.map((m) =>
                    m.senderId === activeThread.partnerId &&
                    m.recipientId === Number(user.userId)
                        ? { ...m, readByRecipient: true }
                        : m,
                ),
            );
        });
    }, [user?.userId, activeThread]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeThread?.messages?.length]);

    const threadProduct = useMemo(() => {
        if (
            contextProduct &&
            activeThread &&
            !activeThread.isCommunity &&
            Number(contextProduct.sellerUserId) === Number(activeThread.partnerId)
        ) {
            return {
                productId: contextProduct.id,
                productName: contextProduct.name,
                productPrice: contextProduct.priceValue,
                productPriceFormatted: contextProduct.price,
                rawProduct: contextProduct,
            };
        }

        return activeThread?.latestProduct || null;
    }, [contextProduct, activeThread]);

    const threadOrder = useMemo(() => {
        if (paramOrderId && activeThread && !activeThread.isCommunity) {
            return {
                orderId: paramOrderId,
                orderNumber: paramOrderNumber || `Order #${paramOrderId}`,
            };
        }
        return activeThread?.latestOrder || null;
    }, [paramOrderId, paramOrderNumber, activeThread]);

    async function handleSend(customText = null, includeProposal = false) {
        const text = String(customText ?? draft).trim();

        if (!text || !user?.userId || !activeThread) {
            return;
        }

        setSending(true);

        try {
            const sent = await sendMessage({
                senderId: user.userId,
                senderName:
                    user.displayName ||
                    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
                    user.email,
                senderRole: user.role || "STUDENT",
                recipientId: activeThread.isCommunity ? 0 : activeThread.partnerId,
                recipientName: activeThread.partnerName,
                recipientRole: activeThread.partnerRole,
                productId: threadProduct?.productId || null,
                productName: threadProduct?.productName || null,
                productPrice: threadProduct?.productPrice ?? null,
                orderId: threadOrder?.orderId || null,
                orderNumber: threadOrder?.orderNumber || null,
                proposedPaymentMethod: includeProposal ? proposedMethod : null,
                meetupLocation: includeProposal ? proposedMeetup : null,
                content: text,
            });

            setMessages((prev) => [...prev, sent]);
            if (customText === null) {
                setDraft("");
            }
            setShowProposalBar(false);

            /* Refresh after 1.1s so any seller reply appears automatically. */
            setTimeout(() => {
                loadMessages(true);
            }, 1150);
        } catch {
            showToast("We couldn't send that message. Please try again.");
        } finally {
            setSending(false);
        }
    }

    function sendPaymentProposal() {
        const methodText = paymentMethodLabel(proposedMethod);
        const proposalMessage =
            proposedMethod === "CASH"
                ? `Payment Proposal: Let's do ${methodText} (${
                    threadProduct?.productPriceFormatted || "agreed price"
                }) at ${proposedMeetup}.`
                : `Payment Proposal: I'd like to pay via ${methodText} and collect at ${proposedMeetup}.`;

        handleSend(proposalMessage, true);
    }

    async function proceedWithProposal(method, meetup) {
        if (threadProduct?.productId) {
            try {
                const fullProduct =
                    threadProduct.rawProduct ||
                    (await getProductById(threadProduct.productId));

                if (!has(fullProduct.id)) {
                    addItem(fullProduct, 1);
                }
            } catch {
                // Continue to checkout with current cart if product fetch fails
            }
        }

        const params = new URLSearchParams();
        if (method) {
            params.set("method", method);
        }
        if (meetup) {
            params.set("meetup", meetup);
        }

        showToast(`Applied ${paymentMethodLabel(method || "CASH")} for checkout`);
        navigate(`/checkout?${params.toString()}`);
    }

    return (
        <div className="screen">
            <TopBar onBell={() => navigate("/notifications")} />

            <div className="scroll-area route-content chat-page-content">
                <div className="page-header">
                    <div>
                        <h1>Marketplace Chat</h1>
                        <p>
                            Coordinate payment methods, safe campus meetups & order handovers
                        </p>
                    </div>

                    <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => loadMessages(false)}
                    >
                        <i className="bi bi-arrow-clockwise" /> Refresh
                    </button>
                </div>

                {/* ── Conversation Selector Strip / Inbox ── */}
                <section className="chat-inbox-strip" aria-label="Conversations">
                    {conversations.map((conv) => {
                        const isActive =
                            activeThread && conv.partnerId === activeThread.partnerId;
                        return (
                            <button
                                type="button"
                                key={conv.partnerId}
                                className={`chat-thread-pill ${isActive ? "active" : ""}`}
                                onClick={() => setActivePartnerId(conv.partnerId)}
                            >
                                <div
                                    className={`chat-avatar ${
                                        conv.isCommunity
                                            ? "community"
                                            : conv.partnerRole === "VENDOR"
                                                ? "vendor"
                                                : ""
                                    }`}
                                >
                                    {conv.isCommunity ? (
                                        <i className="bi bi-people-fill" />
                                    ) : (
                                        initials(conv.partnerName)
                                    )}
                                </div>

                                <div className="chat-thread-meta">
                                    <div className="chat-thread-top">
                                        <strong>{conv.partnerName}</strong>
                                        {conv.unreadCount > 0 && (
                                            <span className="chat-unread-dot">
                        {conv.unreadCount}
                      </span>
                                        )}
                                    </div>
                                    <small>
                                        {conv.isCommunity
                                            ? "Public Campus Channel"
                                            : `${conv.partnerRole}${
                                                conv.latestProduct
                                                    ? ` · ${conv.latestProduct.productName}`
                                                    : ""
                                            }`}
                                    </small>
                                </div>
                            </button>
                        );
                    })}
                </section>

                {loading ? (
                    <Loader label="Loading conversations..." />
                ) : !activeThread ? (
                    <Banner tone="info" icon="bi-chat-dots">
                        Select a listing on the Marketplace and tap{" "}
                        <strong>Message seller</strong> to start a conversation.
                    </Banner>
                ) : (
                    <div className="chat-window-card">
                        {/* ── Active Thread Header ── */}
                        <div className="chat-window-header">
                            <div className="chat-window-partner">
                                <div
                                    className={`chat-avatar ${
                                        activeThread.isCommunity
                                            ? "community"
                                            : activeThread.partnerRole === "VENDOR"
                                                ? "vendor"
                                                : ""
                                    }`}
                                >
                                    {activeThread.isCommunity ? (
                                        <i className="bi bi-people-fill" />
                                    ) : (
                                        initials(activeThread.partnerName)
                                    )}
                                </div>

                                <div>
                                    <h2>
                                        {activeThread.partnerName}{" "}
                                        {activeThread.partnerRole === "VENDOR" && (
                                            <i
                                                className="bi bi-patch-check-fill verified-icon"
                                                title="Verified Campus Vendor"
                                            />
                                        )}
                                    </h2>
                                    <p>
                                        {activeThread.isCommunity
                                            ? "Ask the campus community about books, safe zones & trades"
                                            : activeThread.partnerRole === "VENDOR"
                                                ? "Verified Business Seller · Agree on cash or EFT directly"
                                                : `Peer Seller (${activeThread.partnerRole}) · Agree on cash or EFT directly`}
                                    </p>
                                </div>
                            </div>

                            {!activeThread.isCommunity && (
                                <button
                                    type="button"
                                    className="secondary-action small"
                                    onClick={() => setShowProposalBar((prev) => !prev)}
                                >
                                    <i className="bi bi-cash-coin" />{" "}
                                    {showProposalBar ? "Close proposal" : "Propose Payment"}
                                </button>
                            )}
                        </div>

                        {/* ── Linked Listing / Order Context Banner ── */}
                        {!activeThread.isCommunity && (threadProduct || threadOrder) && (
                            <div className="chat-context-bar">
                                <div className="chat-context-info">
                                    {threadProduct && (
                                        <span>
                      <i className="bi bi-tag-fill" />{" "}
                                            <strong>{threadProduct.productName}</strong>
                                            {threadProduct.productPriceFormatted
                                                ? ` · ${threadProduct.productPriceFormatted}`
                                                : ""}
                    </span>
                                    )}

                                    {threadOrder && (
                                        <span className="chat-order-badge">
                      <i className="bi bi-receipt" /> {threadOrder.orderNumber}
                    </span>
                                    )}
                                </div>

                                <div className="chat-context-actions">
                                    {threadProduct?.productId && (
                                        <button
                                            type="button"
                                            className="ghost-btn small"
                                            onClick={() =>
                                                navigate(`/product/${threadProduct.productId}`)
                                            }
                                        >
                                            Listing
                                        </button>
                                    )}

                                    {threadOrder?.orderId ? (
                                        <button
                                            type="button"
                                            className="primary-action small"
                                            onClick={() =>
                                                navigate(`/orders/${threadOrder.orderId}`)
                                            }
                                        >
                                            View Order & Payment
                                        </button>
                                    ) : (
                                        threadProduct && (
                                            <button
                                                type="button"
                                                className="primary-action small"
                                                onClick={() =>
                                                    proceedWithProposal(
                                                        activeThread.latestProposal
                                                            ?.proposedPaymentMethod ||
                                                        (activeThread.partnerRole === "VENDOR"
                                                            ? "EFT"
                                                            : "CASH"),
                                                        activeThread.latestProposal?.meetupLocation ||
                                                        SAFE_EXCHANGE_ZONES[0].address,
                                                    )
                                                }
                                            >
                                                <i className="bi bi-bag-check" /> Buy with Agreed
                                                Payment
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Payment & Meetup Proposal Drawer (Facebook Marketplace style) ── */}
                        {showProposalBar && !activeThread.isCommunity && (
                            <div className="chat-proposal-drawer">
                                <div className="chat-proposal-title">
                                    <i className="bi bi-handshake" /> Propose a Payment Method &
                                    Campus Safe Meetup Point
                                </div>

                                <div className="form-row">
                                    <label>
                                        Proposed payment method
                                        <select
                                            value={proposedMethod}
                                            onChange={(e) => setProposedMethod(e.target.value)}
                                        >
                                            {PAYMENT_METHODS.map((m) => (
                                                <option key={m.value} value={m.value}>
                                                    {m.label} ({m.badge})
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Campus meetup / collection point
                                        <select
                                            value={proposedMeetup}
                                            onChange={(e) => setProposedMeetup(e.target.value)}
                                        >
                                            {SAFE_EXCHANGE_ZONES.map((z) => (
                                                <option key={z.id} value={z.label}>
                                                    {z.label}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="chat-proposal-actions">
                                    <button
                                        type="button"
                                        className="primary-action small"
                                        onClick={sendPaymentProposal}
                                        disabled={sending}
                                    >
                                        <i className="bi bi-send-check" /> Send Payment Proposal to{" "}
                                        {activeThread.partnerName}
                                    </button>

                                    {threadProduct && (
                                        <button
                                            type="button"
                                            className="secondary-action small"
                                            onClick={() =>
                                                proceedWithProposal(proposedMethod, proposedMeetup)
                                            }
                                        >
                                            <i className="bi bi-cart-check" /> Go straight to Checkout
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Message History Stream ── */}
                        <div className="chat-messages-stream">
                            {activeThread.messages.length === 0 ? (
                                <div className="chat-empty-thread">
                                    <i className="bi bi-chat-heart" />
                                    <p>
                                        Start chatting with{" "}
                                        <strong>{activeThread.partnerName}</strong> to agree on{" "}
                                        {activeThread.partnerRole === "VENDOR"
                                            ? "cash or EFT payment and collection"
                                            : "cash or EFT payment at a safe public meetup"}
                                        .
                                    </p>
                                </div>
                            ) : (
                                activeThread.messages.map((msg) => {
                                    const isMine = Number(msg.senderId) === Number(user?.userId);
                                    return (
                                        <div
                                            key={msg.messageId}
                                            className={`chat-bubble-row ${isMine ? "mine" : "theirs"}`}
                                        >
                                            <div
                                                className={`chat-bubble ${isMine ? "mine" : "theirs"}`}
                                            >
                                                <div className="chat-bubble-head">
                                                    <strong>{isMine ? "You" : msg.senderName}</strong>
                                                    <span className="chat-role-tag">
                            {msg.senderRole}
                          </span>
                                                </div>

                                                {(msg.proposedPaymentMethod || msg.meetupLocation) && (
                                                    <div className="chat-proposal-tag">
                            <span>
                              <i className="bi bi-shield-check" />{" "}
                                {msg.proposedPaymentMethod
                                    ? paymentMethodLabel(msg.proposedPaymentMethod)
                                    : "Safe Meetup"}
                                {msg.meetupLocation
                                    ? ` · ${msg.meetupLocation}`
                                    : ""}
                            </span>

                                                        {!activeThread.isCommunity && (
                                                            <button
                                                                type="button"
                                                                className="chat-proposal-accept-btn"
                                                                onClick={() =>
                                                                    proceedWithProposal(
                                                                        msg.proposedPaymentMethod || "CASH",
                                                                        msg.meetupLocation ||
                                                                        SAFE_EXCHANGE_ZONES[0].address,
                                                                    )
                                                                }
                                                            >
                                                                Checkout with this →
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <p className="chat-bubble-text">{msg.content}</p>

                                                <span className="chat-bubble-time">
                          {formatDateTime(msg.sentAt)}
                        </span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* ── Quick-Reply Chips ── */}
                        <div className="chat-quick-bar">
                            {QUICK_REPLIES.map((reply) => (
                                <button
                                    type="button"
                                    key={reply}
                                    className="quick-prompt-chip"
                                    onClick={() => handleSend(reply, false)}
                                    disabled={sending}
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        {/* ── Message Composer ── */}
                        <form
                            className="chat-composer"
                            onSubmit={(event) => {
                                event.preventDefault();
                                handleSend(null, false);
                            }}
                        >
                            <input
                                type="text"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                placeholder={`Message ${activeThread.partnerName} about payment or meetup...`}
                                maxLength={1000}
                                disabled={sending}
                            />

                            <button
                                type="submit"
                                className="primary-action small"
                                disabled={sending || !draft.trim()}
                            >
                                <i className="bi bi-send-fill" /> Send
                            </button>
                        </form>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default Chat;