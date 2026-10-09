package com.communitystore.repository;

import com.communitystore.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findBySenderIdOrRecipientIdOrderBySentAtAsc(Long senderId, Long recipientId);

    List<ChatMessage> findByRecipientIdOrderBySentAtAsc(Long recipientId);
}
