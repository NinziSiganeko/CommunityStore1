import { useNavigate } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import BottomNav from "../components/BottomNav";
import thaboImg from "../assets/products/Thabo.webp";
import sarah from "../assets/products/Sarah.webp";

export default function ChatList() {
    const navigate = useNavigate();

    const conversations = [
        {
            id: 1,
            seller: {
                name: "Alex Johnson",
                avatar:
                    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
            },
            productTitle: "Vintage SLR 35mm Camera",
            lastMessage: "Perfect, see you then 👍",
            time: "10:29",
            unread: 0,
        },
        {
            id: 2,
            seller: {
                name: "Sarah Nkosi",
                avatar:
                sarah,
            },
            productTitle: "Handmade Birthday Cake",
            lastMessage: "Yes, still available! Can you collect tomorrow?",
            time: "09:15",
            unread: 2,
        },
        {
            id: 3,
            seller: {
                name: "Thabo Molefe",
                avatar:
                thaboImg,
            },
            productTitle: "Wireless Keyboard",
            lastMessage: "You: Is R800 okay?",
            time: "Yesterday",
            unread: 0,
        },
    ];

    const openChat = (conversation) => {
        navigate("/message", {
            state: {
                seller: conversation.seller,
                productTitle: conversation.productTitle,
            },
        });
    };

    return (
        <div className="cs-page">
            <header className="cs-header">
                <div style={{ width: 34 }} />
                <h1 className="title">Chats</h1>
                <button className="icon-btn" aria-label="Search">
                    <Search size={20} />
                </button>
            </header>

            <div className="chat-list">
                {conversations.length === 0 && (
                    <p className="chat-list-empty">No conversations yet.</p>
                )}

                {conversations.map((conv) => (
                    <button
                        key={conv.id}
                        className="chat-list-item"
                        onClick={() => openChat(conv)}
                    >
                        <img
                            src={conv.seller.avatar}
                            alt={conv.seller.name}
                            className="chat-list-avatar"
                        />
                        <div className="chat-list-info">
                            <div className="chat-list-top">
                                <h4 className="chat-list-name">{conv.seller.name}</h4>
                                <span className="chat-list-time">{conv.time}</span>
                            </div>
                            <p className="chat-list-product">{conv.productTitle}</p>
                            <p className="chat-list-preview">{conv.lastMessage}</p>
                        </div>
                        {conv.unread > 0 && (
                            <span className="chat-list-badge">{conv.unread}</span>
                        )}
                    </button>
                ))}
            </div>

            <BottomNav />
        </div>
    );
}