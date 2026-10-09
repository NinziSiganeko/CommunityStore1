package com.communitystore.controller;

import com.communitystore.domain.ChatMessage;
import com.communitystore.service.ChatService;
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

    private final ChatService messages;

    public ChatController(ChatService messages) {
        this.messages = messages;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getForUser(@PathVariable Long userId) {
        try {
            List<ChatMessage> userMessages = messages.findMessagesForUser(userId);
            return ResponseEntity.ok(userMessages);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> send(@RequestBody ChatMessage message) {
        try {
            ChatMessage saved = messages.send(message);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/read")
    public ResponseEntity<?> markRead(
            @RequestParam Long userId,
            @RequestParam Long partnerId
    ) {
        try {
            int count = messages.markConversationRead(userId, partnerId);
            return ResponseEntity.ok(Map.of("updated", count));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}