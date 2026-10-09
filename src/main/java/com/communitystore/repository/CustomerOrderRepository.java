package com.communitystore.repository;

import com.communitystore.domain.CustomerOrder;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerOrderRepository
        extends JpaRepository<CustomerOrder, Long> {

    @Override
    @EntityGraph(attributePaths = {
            "buyer",
            "orderItems",
            "orderItems.product",
            "orderItems.product.category",
            "orderItems.product.seller"
    })
    Optional<CustomerOrder> findById(Long orderId);

    @EntityGraph(attributePaths = {
            "buyer",
            "orderItems",
            "orderItems.product",
            "orderItems.product.category",
            "orderItems.product.seller"
    })
    @Query("""
        SELECT DISTINCT co
        FROM CustomerOrder co
        WHERE co.buyer.userId = :userId
        ORDER BY co.orderDate DESC
        """)
    List<CustomerOrder> findByBuyerUserId(
            @Param("userId") Long userId
    );

    @EntityGraph(attributePaths = {
            "buyer",
            "orderItems",
            "orderItems.product",
            "orderItems.product.category",
            "orderItems.product.seller"
    })
    @Query("""
        SELECT DISTINCT co
        FROM CustomerOrder co
        JOIN co.orderItems oi
        WHERE oi.product.seller.userId = :sellerId
        ORDER BY co.orderDate DESC
        """)
    List<CustomerOrder> findOrdersForSeller(
            @Param("sellerId") Long sellerId
    );

    @EntityGraph(attributePaths = {
            "buyer",
            "orderItems",
            "orderItems.product",
            "orderItems.product.category",
            "orderItems.product.seller"
    })
    CustomerOrder findByOrderNumber(String orderNumber);
}