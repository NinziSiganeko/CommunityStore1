package com.communitystore.factory;

import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.domain.User;
import com.communitystore.util.Helper;

import java.util.List;

public class CustomerOrderFactory {

    public static CustomerOrder createOrder(
            User buyer,
            List<OrderItem> orderItems,
            String paymentMethod,
            String shippingAddress
    ) {
        if (!Helper.isValidUser(buyer)) {
            throw new IllegalArgumentException("Buyer cannot be null");
        }

        if (!Helper.hasValidOrderItems(orderItems)) {
            throw new IllegalArgumentException(
                    "Order must contain at least one item"
            );
        }

        if (!Helper.isValidPaymentMethod(paymentMethod)) {
            throw new IllegalArgumentException(
                    "Invalid payment method"
            );
        }

        if (!Helper.isValidAddress(shippingAddress)) {
            throw new IllegalArgumentException(
                    "Collection/delivery details must be between 10 and 200 characters"
            );
        }

        if (!Helper.isValidId(buyer.getUserId())) {
            throw new IllegalArgumentException(
                    "Buyer must have a valid ID"
            );
        }

        for (OrderItem item : orderItems) {
            if (item.getProduct() == null) {
                throw new IllegalArgumentException(
                        "Order item must have a valid product"
                );
            }

            if (!Helper.isValidQuantity(item.getQuantity())) {
                throw new IllegalArgumentException(
                        "Invalid quantity for an order item"
                );
            }

            if (!Helper.isValidAmount(item.getUnitPrice())) {
                throw new IllegalArgumentException(
                        "Invalid item price"
                );
            }
        }

        String orderNumber = Helper.generateOrderNumber();

        double initialTotal = orderItems.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        if (!Helper.isValidOrderTotal(initialTotal)) {
            throw new IllegalArgumentException(
                    "Invalid order total amount"
            );
        }

        return new CustomerOrder.Builder()
                .setOrderNumber(orderNumber)
                .setBuyer(buyer)
                .setOrderItems(orderItems)
                .setTotalAmount(initialTotal)
                .setPaymentMethod(paymentMethod.toUpperCase())
                .setShippingAddress(shippingAddress.trim())
                .setOrderDate(Helper.getCurrentDateTime())
                .setStatus("PENDING_SELLER_CONFIRMATION")
                .build();
    }

    public static CustomerOrder createOrderWithId(
            Long orderId,
            User buyer,
            List<OrderItem> orderItems,
            String paymentMethod,
            String shippingAddress
    ) {
        if (!Helper.isValidId(orderId)) {
            throw new IllegalArgumentException(
                    "Order ID must be valid"
            );
        }

        CustomerOrder order = createOrder(
                buyer,
                orderItems,
                paymentMethod,
                shippingAddress
        );

        return new CustomerOrder.Builder()
                .copy(order)
                .setOrderId(orderId)
                .build();
    }
}