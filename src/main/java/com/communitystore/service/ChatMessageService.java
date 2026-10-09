package com.communitystore.service;

import com.communitystore.domain.ChatMessage;
import com.communitystore.repository.ChatMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ChatMessageService {

    private final ChatMessageRepository repository;

    public ChatMessageService(ChatMessageRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ChatMessage send(ChatMessage message) {
        if (message == null) {
            throw new IllegalArgumentException("Message is required");
        }

        if (message.getSenderId() == null || message.getSenderId() <= 0) {
            throw new IllegalArgumentException("Sender ID is required");
        }

        if (message.getRecipientId() == null || message.getRecipientId() < 0) {
            message.setRecipientId(0L);
        }

        String text = message.getContent() != null ? message.getContent().trim() : "";

        if (text.isEmpty()) {
            throw new IllegalArgumentException("Message cannot be empty");
        }

        if (text.length() > 1000) {
            throw new IllegalArgumentException("Message cannot exceed 1000 characters");
        }

        message.setContent(text);
        message.setSentAt(LocalDateTime.now());
        message.setReadByRecipient(false);

        return repository.save(message);
    }

    @Transactional(readOnly = true)
    public List<ChatMessage> findMessagesForUser(Long userId) {
        List<ChatMessage> direct = userId != null && userId > 0
                ? repository.findBySenderIdOrRecipientIdOrderBySentAtAsc(userId, userId)
                : List.of();
        List<ChatMessage> community = repository.findByRecipientIdOrderBySentAtAsc(0L);

        Map<Long, ChatMessage> merged = new LinkedHashMap<>();

        for (ChatMessage msg : direct) {
            merged.put(msg.getMessageId(), msg);
        }

        for (ChatMessage msg : community) {
            merged.put(msg.getMessageId(), msg);
        }

        List<ChatMessage> result = new ArrayList<>(merged.values());
        result.sort(Comparator.comparing(
                msg -> msg.getSentAt() != null ? msg.getSentAt() : LocalDateTime.MIN
        ));
        return result;
    }

    @Transactional
    public int markConversationRead(Long userId, Long partnerId) {
        if (userId == null || partnerId == null) {
            return 0;
        }

        List<ChatMessage> messages = repository.findBySenderIdOrRecipientIdOrderBySentAtAsc(userId, userId);
        int updated = 0;

        for (ChatMessage msg : messages) {
            if (partnerId.equals(msg.getSenderId())
                    && userId.equals(msg.getRecipientId())
                    && !msg.isReadByRecipient()) {
                msg.setReadByRecipient(true);
                repository.save(msg);
                updated++;
            }
        }

        return updated;
    }
}
