package com.communitystore.repository;

import com.communitystore.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatRepository extends JpaRepository<ChatMessage, Long> {

    @Query("""
        SELECT message
        FROM ChatMessage message
        WHERE message.recipientId = 0
           OR message.senderId = :userId
           OR message.recipientId = :userId
        ORDER BY message.sentAt ASC, message.messageId ASC
        """)
    List<ChatMessage> findMessagesForUser(@Param("userId") Long userId);

    @Modifying
    @Query("""
        UPDATE ChatMessage message
        SET message.readByRecipient = true
        WHERE message.senderId = :partnerId
          AND message.recipientId = :userId
          AND message.readByRecipient = false
        """)
    int markConversationRead(
            @Param("userId") Long userId,
            @Param("partnerId") Long partnerId
    );
}
