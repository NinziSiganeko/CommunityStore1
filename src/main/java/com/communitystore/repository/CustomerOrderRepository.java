package com.communitystore.repository;

import com.communitystore.domain.CustomerOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {

    @Query("SELECT co FROM CustomerOrder co WHERE co.buyer.userId = :userId ORDER BY co.orderDate DESC")
    List<CustomerOrder> findByBuyerUserId(@Param("userId") Long userId);

    // ESSENTIAL: Find order by order number
    CustomerOrder findByOrderNumber(String orderNumber);
}
