import apiClient from "./apiClient.js";
import { formatCurrency } from "../utils/format.js";

const FALLBACK_STORAGE_KEY = "communityStoreChatMessages";

function readFallbackMessages() {
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackMessages(list) {
  try {
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage errors
  }
}

function mapMessage(raw) {
  return {
    messageId: raw?.messageId ?? Date.now(),
    senderId: Number(raw?.senderId || 0),
    senderName: raw?.senderName || "Community Member",
    senderRole: String(raw?.senderRole || "STUDENT").toUpperCase(),
    recipientId: Number(raw?.recipientId ?? 0),
    recipientName: raw?.recipientName || "Seller",
    recipientRole: String(raw?.recipientRole || "STUDENT").toUpperCase(),
    productId: raw?.productId ? Number(raw.productId) : null,
    productName: raw?.productName || null,
    productPrice:
      raw?.productPrice !== undefined && raw?.productPrice !== null
        ? Number(raw.productPrice)
        : null,
    productPriceFormatted:
      raw?.productPrice !== undefined && raw?.productPrice !== null
        ? formatCurrency(raw.productPrice)
        : null,
    orderId: raw?.orderId ? Number(raw.orderId) : null,
    orderNumber: raw?.orderNumber || null,
    proposedPaymentMethod: raw?.proposedPaymentMethod || null,
    meetupLocation: raw?.meetupLocation || null,
    content: String(raw?.content || ""),
    sentAt: raw?.sentAt || new Date().toISOString(),
    readByRecipient: Boolean(raw?.readByRecipient),
  };
}

async function getMessagesForUser(userId) {
  if (!userId) {
    return [];
  }

  try {
    const response = await apiClient.get(`/messages/user/${userId}`);
    const list = Array.isArray(response.data)
      ? response.data.map(mapMessage)
      : [];
    writeFallbackMessages(list);
    return list;
  } catch {
    return readFallbackMessages().map(mapMessage);
  }
}

async function sendMessage({
  senderId,
  senderName,
  senderRole,
  recipientId = 0,
  recipientName,
  recipientRole,
  productId = null,
  productName = null,
  productPrice = null,
  orderId = null,
  orderNumber = null,
  proposedPaymentMethod = null,
  meetupLocation = null,
  content,
}) {
  const payload = {
    senderId: Number(senderId),
    senderName,
    senderRole,
    recipientId: Number(recipientId ?? 0),
    recipientName,
    recipientRole,
    productId: productId ? Number(productId) : null,
    productName,
    productPrice:
      productPrice !== undefined && productPrice !== null
        ? Number(productPrice)
        : null,
    orderId: orderId ? Number(orderId) : null,
    orderNumber,
    proposedPaymentMethod,
    meetupLocation,
    content: String(content || "").trim(),
  };

  try {
    const response = await apiClient.post("/messages", payload);
    return mapMessage(response.data);
  } catch {
    const fallback = mapMessage({
      ...payload,
      messageId: Date.now(),
      sentAt: new Date().toISOString(),
      readByRecipient: false,
    });
    const current = readFallbackMessages();
    writeFallbackMessages([...current, fallback]);
    return fallback;
  }
}

async function markConversationRead(userId, partnerId) {
  if (!userId || partnerId === undefined || partnerId === null) {
    return;
  }

  try {
    await apiClient.put("/messages/read", null, {
      params: { userId, partnerId },
    });
  } catch {
    // Non-blocking
  }
}

/**
 * Groups flat messages into conversation threads for the inbox.
 *
 * Thread 0 is always the public Campus Community Lounge so every
 * student, resident and vendor has a shared space as well as
 * direct 1-on-1 buyer/seller threads.
 */
function buildConversations(messages, currentUserId) {
  const me = Number(currentUserId || 0);
  const threads = new Map();

  threads.set(0, {
    partnerId: 0,
    partnerName: "Campus Community Lounge",
    partnerRole: "COMMUNITY",
    isCommunity: true,
    messages: [],
    unreadCount: 0,
    lastMessage: null,
    latestProduct: null,
    latestOrder: null,
    latestProposal: null,
  });

  messages.forEach((msg) => {
    const isCommunity = Number(msg.recipientId) === 0;
    const partnerId = isCommunity
      ? 0
      : msg.senderId === me
        ? msg.recipientId
        : msg.senderId;

    if (!isCommunity && (!partnerId || partnerId === me)) {
      return;
    }

    const partnerName = isCommunity
      ? "Campus Community Lounge"
      : msg.senderId === me
        ? msg.recipientName || `User #${partnerId}`
        : msg.senderName || `User #${partnerId}`;

    const partnerRole = isCommunity
      ? "COMMUNITY"
      : msg.senderId === me
        ? msg.recipientRole || "STUDENT"
        : msg.senderRole || "STUDENT";

    if (!threads.has(partnerId)) {
      threads.set(partnerId, {
        partnerId,
        partnerName,
        partnerRole,
        isCommunity: false,
        messages: [],
        unreadCount: 0,
        lastMessage: null,
        latestProduct: null,
        latestOrder: null,
        latestProposal: null,
      });
    }

    const thread = threads.get(partnerId);
    if (!thread.isCommunity && partnerName && !partnerName.startsWith("User #")) {
      thread.partnerName = partnerName;
      thread.partnerRole = partnerRole;
    }

    thread.messages.push(msg);
    thread.lastMessage = msg;

    if (!isCommunity && msg.recipientId === me && !msg.readByRecipient) {
      thread.unreadCount += 1;
    }

    if (msg.productId && msg.productName) {
      thread.latestProduct = {
        productId: msg.productId,
        productName: msg.productName,
        productPrice: msg.productPrice,
        productPriceFormatted: msg.productPriceFormatted,
      };
    }

    if (msg.orderId && msg.orderNumber) {
      thread.latestOrder = {
        orderId: msg.orderId,
        orderNumber: msg.orderNumber,
      };
    }

    if (msg.proposedPaymentMethod || msg.meetupLocation) {
      thread.latestProposal = {
        proposedPaymentMethod: msg.proposedPaymentMethod,
        meetupLocation: msg.meetupLocation,
        senderName: msg.senderName,
      };
    }
  });

  const directThreads = [];
  let communityThread = threads.get(0);

  threads.forEach((thread, key) => {
    if (key === 0) {
      communityThread = thread;
    } else {
      directThreads.push(thread);
    }
  });

  directThreads.sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.sentAt).getTime() : 0;
    const timeB = b.lastMessage ? new Date(b.lastMessage.sentAt).getTime() : 0;
    return timeB - timeA;
  });

  return [...directThreads, communityThread];
}

export {
  buildConversations,
  getMessagesForUser,
  mapMessage,
  markConversationRead,
  sendMessage,
};
