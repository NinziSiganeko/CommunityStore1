package com.communitystore.factory;

import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.util.Helper;

import java.util.List;

public class CustomerOrderFactory {

    public static CustomerOrder createOrder(User buyer, List<OrderItem> orderItems,
                                            String paymentMethod, String shippingAddress) {

        // Comprehensive validation
        if (!Helper.isValidUser(buyer)) {
            throw new IllegalArgumentException("Buyer cannot be null");
        }

        if (!Helper.hasValidOrderItems(orderItems)) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }

        if (!Helper.isValidPaymentMethod(paymentMethod)) {
            throw new IllegalArgumentException("Invalid payment method");
        }

        if (!Helper.isValidAddress(shippingAddress)) {
            throw new IllegalArgumentException("Shipping address must be between 10-200 characters");
        }

        if (!Helper.isValidId(buyer.getUserId())) {
            throw new IllegalArgumentException("Buyer must have a valid ID");
        }

        // Validate all order items
        for (OrderItem item : orderItems) {
            if (item.getProduct() == null) {
                throw new IllegalArgumentException("Order item must have a valid product");
            }
            if (!Helper.isValidQuantity(item.getQuantity())) {
                throw new IllegalArgumentException("Invalid quantity for product: " + item.getProduct().getName());
            }
            if (!Helper.isValidAmount(item.getUnitPrice())) {
                throw new IllegalArgumentException("Invalid unit price for product: " + item.getProduct().getName());
            }
        }

        // Generate order number
        String orderNumber = Helper.generateOrderNumber();

        // Calculate total amount from order items
        Double totalAmount = orderItems.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        if (!Helper.isValidOrderTotal(totalAmount)) {
            throw new IllegalArgumentException("Invalid order total amount");
        }

        return new CustomerOrder.Builder()
                .setOrderNumber(orderNumber)
                .setBuyer(buyer)
                .setOrderItems(orderItems)
                .setTotalAmount(totalAmount)
                .setPaymentMethod(paymentMethod.toUpperCase())
                .setShippingAddress(shippingAddress.trim())
                .setOrderDate(Helper.getCurrentDateTime())
                .setStatus("CONFIRMED")
                .build();
    }

    public static CustomerOrder createOrderWithId(Long orderId, User buyer, List<OrderItem> orderItems,
                                                  String paymentMethod, String shippingAddress) {

        if (!Helper.isValidId(orderId)) {
            throw new IllegalArgumentException("Order ID must be valid");
        }

        CustomerOrder order = createOrder(buyer, orderItems, paymentMethod, shippingAddress);

        return new CustomerOrder.Builder()
                .copy(order)
                .setOrderId(orderId)
                .build();
    }
}
