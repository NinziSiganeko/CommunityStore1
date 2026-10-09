package com.communitystore.repository;

import com.communitystore.domain.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = {"buyer", "customerOrder"})
    Optional<Payment> findByCustomerOrder_OrderId(Long orderId);
}