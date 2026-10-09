package com.communitystore.service;

import com.communitystore.domain.ChatMessage;
import com.communitystore.domain.User;
import com.communitystore.repository.ChatRepository;
import com.communitystore.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChatService {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    public ChatService(ChatRepository chatRepository, UserRepository userRepository) {
        this.chatRepository = chatRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> findMessagesForUser(Long userId) {
        requirePositiveId(userId, "User ID");
        return chatRepository.findMessagesForUser(userId);
    }

    @Transactional
    public ChatMessage send(ChatMessage message) {
        if (message == null) {
            throw new IllegalArgumentException("Message details are required");
        }

        Long senderId = message.getSenderId();
        requirePositiveId(senderId, "Sender ID");

        Long recipientId = message.getRecipientId() == null
                ? 0L
                : message.getRecipientId();
        if (recipientId < 0) {
            throw new IllegalArgumentException("Recipient ID cannot be negative");
        }
        if (recipientId > 0 && recipientId.equals(senderId)) {
            throw new IllegalArgumentException("You cannot send a direct message to yourself");
        }

        String content = trim(message.getContent());
        if (content == null || content.isEmpty()) {
            throw new IllegalArgumentException("Message content is required");
        }
        requireMaxLength(content, 1000, "Message content");

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender account not found"));
        message.setSenderName(limitDisplayName(displayName(sender)));
        message.setSenderRole(sender.getUserType() == null ? "STUDENT" : sender.getUserType().name());

        if (recipientId == 0) {
            message.setRecipientName("Campus Community Lounge");
            message.setRecipientRole("COMMUNITY");
        } else {
            User recipient = userRepository.findById(recipientId)
                    .orElseThrow(() -> new IllegalArgumentException("Recipient account not found"));
            message.setRecipientName(limitDisplayName(displayName(recipient)));
            message.setRecipientRole(
                    recipient.getUserType() == null ? "STUDENT" : recipient.getUserType().name()
            );
        }

        requirePositiveIfPresent(message.getProductId(), "Product ID");
        requirePositiveIfPresent(message.getOrderId(), "Order ID");
        if (message.getProductPrice() != null
                && (!Double.isFinite(message.getProductPrice()) || message.getProductPrice() < 0)) {
            throw new IllegalArgumentException("Product price must be a non-negative number");
        }

        message.setContent(content);
        message.setProductName(trimAndLimit(message.getProductName(), 160, "Product name"));
        message.setOrderNumber(trimAndLimit(message.getOrderNumber(), 60, "Order number"));
        message.setProposedPaymentMethod(
                trimAndLimit(message.getProposedPaymentMethod(), 40, "Proposed payment method")
        );
        message.setMeetupLocation(
                trimAndLimit(message.getMeetupLocation(), 180, "Meetup location")
        );
        message.setMessageId(null);
        message.setSentAt(LocalDateTime.now());
        message.setReadByRecipient(false);

        return chatRepository.save(message);
    }

    @Transactional
    public int markConversationRead(Long userId, Long partnerId) {
        requirePositiveId(userId, "User ID");
        if (partnerId == null || partnerId < 0) {
            throw new IllegalArgumentException("Partner ID must be zero or a positive number");
        }
        if (partnerId == 0) {
            return 0;
        }
        return chatRepository.markConversationRead(userId, partnerId);
    }

    private static String displayName(User user) {
        String name = ((user.getFirstName() == null ? "" : user.getFirstName().trim())
                + " " + (user.getLastName() == null ? "" : user.getLastName().trim())).trim();
        return name.isEmpty() ? user.getEmail() : name;
    }

    private static String limitDisplayName(String name) {
        return name.length() <= 120 ? name : name.substring(0, 120);
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }

    private static String trimAndLimit(String value, int maxLength, String label) {
        String trimmed = trim(value);
        if (trimmed != null) {
            requireMaxLength(trimmed, maxLength, label);
        }
        return trimmed;
    }

    private static void requirePositiveId(Long id, String label) {
        if (id == null || id <= 0) {
            throw new IllegalArgumentException(label + " must be a positive number");
        }
    }

    private static void requirePositiveIfPresent(Long id, String label) {
        if (id != null && id <= 0) {
            throw new IllegalArgumentException(label + " must be a positive number");
        }
    }

    private static void requireMaxLength(String value, int maxLength, String label) {
        if (value.length() > maxLength) {
            throw new IllegalArgumentException(label + " cannot exceed " + maxLength + " characters");
        }
    }
}
