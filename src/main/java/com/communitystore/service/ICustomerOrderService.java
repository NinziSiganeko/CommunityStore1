package com.communitystore.service;

import com.communitystore.domain.CustomerOrder;

import java.util.List;

public interface ICustomerOrderService extends IService<CustomerOrder, Long> {

    List<CustomerOrder> getOrdersByBuyerId(Long userId);

    CustomerOrder getOrderByOrderNumber(String orderNumber);

    List<CustomerOrder> getOrdersForSeller(Long sellerId);

    CustomerOrder respondToOrder(
            Long orderId,
            Long sellerId,
            String decision
    );
}