package com.communitystore.service;

import com.communitystore.domain.CustomerOrder;

import java.util.List;

public interface ICustomerOrderService extends IService<CustomerOrder, Long> {
    List<CustomerOrder> getOrdersByBuyerId(Long userId);
    CustomerOrder getOrderByOrderNumber(String orderNumber);
}
