package com.communitystore.controller;

import com.communitystore.domain.ChatMessage;
import com.communitystore.service.ChatMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/messages")
public class ChatController {

    private final ChatMessageService messages;

    public ChatController(ChatMessageService messages) {
        this.messages = messages;
    }

    @GetMapping("/user/{userId}")
    public List<ChatMessage> getForUser(@PathVariable Long userId) {
        return messages.findMessagesForUser(userId);
    }

    @PostMapping
    public ResponseEntity<?> send(@RequestBody ChatMessage message) {
        try {
            ChatMessage saved = messages.send(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", String.valueOf(e.getMessage())));
        }
    }

    @PutMapping("/read")
    public Map<String, Object> markRead(
            @RequestParam Long userId,
            @RequestParam Long partnerId
    ) {
        int count = messages.markConversationRead(userId, partnerId);
        return Map.of("updated", count);
    }
}
