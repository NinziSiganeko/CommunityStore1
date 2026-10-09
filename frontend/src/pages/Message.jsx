import { useState } from "react";
import { ArrowLeft, Send, Image, Smile } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "../components/BottomNav";

export default function Message() {
    const navigate = useNavigate();
    const location = useLocation();

    const seller = location.state?.seller || {
        name: "Alex Johnson",
        avatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    };

    const productTitle = location.state?.productTitle || "Vintage SLR 35mm Camera";

    const [messages, setMessages] = useState([
        {
            id: 1,
            text: `Hi! Is the "${productTitle}" still available?`,
            sender: "me",
            time: "10:24",
        },
        {
            id: 2,
            text: "Yes, it's still available! Would you like to arrange a meetup on campus?",
            sender: "them",
            time: "10:26",
        },
        {
            id: 3,
            text: "Great! Can we meet at the library entrance tomorrow at 2pm?",
            sender: "me",
            time: "10:28",
        },
        {
            id: 4,
            text: "Perfect, see you then 👍",
            sender: "them",
            time: "10:29",
        },
    ]);

    const [input, setInput] = useState("");

    const sendMessage = () => {
        if (!input.trim()) return;
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages([
            ...messages,
            { id: Date.now(), text: input.trim(), sender: "me", time },
        ]);
        setInput("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="cs-page message-page">
            <header className="cs-header message-header">
                <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Back">
                    <ArrowLeft size={22} />
                </button>

                <div className="message-header-seller" onClick={() => {}}>
                    <img src={seller.avatar} alt={seller.name} className="message-avatar" />
                    <div>
                        <h1 className="message-seller-name">{seller.name}</h1>
                        <span className="message-status">Usually replies within an hour</span>
                    </div>
                </div>

                <div style={{ width: 34 }} />
            </header>

            <div className="chat-area">
                <div className="chat-date">Today</div>

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`chat-bubble-wrap ${msg.sender === "me" ? "me" : "them"}`}
                    >
                        {msg.sender === "them" && (
                            <img src={seller.avatar} alt="" className="bubble-avatar" />
                        )}
                        <div className={`chat-bubble ${msg.sender}`}>
                            <p>{msg.text}</p>
                            <span className="chat-time">{msg.time}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-input-bar">
                <button className="chat-attach-btn" aria-label="Attach">
                    <Image size={22} />
                </button>
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <button
                    className="chat-send-btn"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    aria-label="Send"
                >
                    <Send size={20} />
                </button>
            </div>

            <BottomNav />
        </div>
    );
}