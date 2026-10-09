package com.communitystore.service;

import com.communitystore.domain.User;
import com.communitystore.domain.UserType;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.domain.Product;
import com.communitystore.factory.CustomerOrderFactory;
import com.communitystore.repository.CustomerOrderRepository;
import com.communitystore.repository.ProductRepository;
import com.communitystore.repository.UserRepository;
import com.communitystore.util.Helper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerOrderService implements ICustomerOrderService {

    @Autowired
    private CustomerOrderRepository orderRepository;

    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private UserRepository userRepository;

    @Override
    @Transactional
    public CustomerOrder create(CustomerOrder order) {

        if (order == null || order.getBuyer() == null) {
            throw new IllegalArgumentException(
                    "Order and buyer details are required"
            );
        }

        Long buyerId = order.getBuyer().getUserId();

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Buyer account not found")
                );

        order.setBuyer(buyer);

        if (order.getOrderItems() == null
                || order.getOrderItems().isEmpty()) {
            throw new IllegalArgumentException(
                    "An order must contain at least one item"
            );
        }

        /*
         * Prices and stock must be verified against the database,
         * not trusted from the browser.
         *
         * The transaction ensures stock changes are rolled back
         * if any item cannot be purchased.
         */
        for (OrderItem item : order.getOrderItems()) {

            if (item.getProduct() == null
                    || item.getProduct().getProductId() == null) {
                throw new IllegalArgumentException(
                        "Each order item must contain a valid product"
                );
            }

            if (item.getQuantity() == null
                    || item.getQuantity() <= 0) {
                throw new IllegalArgumentException(
                        "Each order item must have a positive quantity"
                );
            }

            Product product = productRepository
                    .findById(item.getProduct().getProductId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "A product in this order no longer exists"
                            )
                    );

            if (product.getSeller() == null) {
                throw new IllegalArgumentException(
                        "This listing has no seller attached"
                );
            }

            if (product.getSeller().getUserType() == UserType.VENDOR
                    && !product.getSeller().isVerified()) {
                throw new IllegalArgumentException(
                        "A vendor must be verified before their products can be purchased"
                );
            }

            if (product.getStock() < item.getQuantity()) {
                throw new RuntimeException(
                        "Insufficient stock for " + product.getName()
                                + ". Available: " + product.getStock()
                                + ", requested: " + item.getQuantity()
                );
            }

            /*
             * Replace the submitted item reference and unit price
             * with the actual values from the database.
             */
            item.setProduct(product);
            item.setUnitPrice(product.getPrice());
            item.setOrder(order);

            /*
             * Reserve the stock for this order.
             * Cancelling the order uses the existing service logic
             * to return the stock.
             */
            product.setStock(
                    product.getStock() - item.getQuantity()
            );

            productRepository.save(product);
        }

        /*
         * Recalculate the total using the database prices.
         */
        order.setTotalAmount(order.calculateTotal());

        if (order.getOrderNumber() == null
                || order.getOrderNumber().isBlank()) {
            order.setOrderNumber(Helper.generateOrderNumber());
        }

        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDateTime.now());
        }

        /*
         * Creating an order does not mean the seller has accepted it.
         * The payment is also handled separately.
         */
        order.setStatus("PENDING_SELLER_CONFIRMATION");

        return orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOrder read(Long orderId) {
        return orderRepository.findById(orderId).orElse(null);
    }

    @Override
    @Transactional
    public CustomerOrder update(CustomerOrder order) {
        if (orderRepository.existsById(order.getOrderId())) {
            return orderRepository.save(order);
        }
        return null;
    }

    @Override
    @Transactional
    public boolean delete(Long orderId) {
        if (orderRepository.existsById(orderId)) {
            // Optional: Restore stock when order is deleted
            CustomerOrder order = orderRepository.findById(orderId).orElse(null);
            if (order != null && order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    if (item.getProduct() != null && item.getQuantity() != null) {
                        Product product = productRepository.findById(item.getProduct().getProductId()).orElse(null);
                        if (product != null) {
                            int newStock = product.getStock() + item.getQuantity();
                            product.setStock(newStock);
                            productRepository.save(product);
                            System.out.println(" Restored stock for " + product.getName() + ": " +
                                    product.getStock() + " -> " + newStock);
                        }
                    }
                }
            }
            orderRepository.deleteById(orderId);
            return true;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrder> getOrdersByBuyerId(Long userId) {
        return orderRepository.findByBuyerUserId(userId);
    }

    @Override
    @Transactional(readOnly = true)
    public CustomerOrder getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrder> getAll() {
        return orderRepository.findAll();
    }

    // Add this method to CustomerOrderService
    @Transactional
    public CustomerOrder createOrderFromDetails(User buyer, List<OrderItem> orderItems,
                                                String paymentMethod, String shippingAddress) {
        // Use the factory to create order with generated number
        CustomerOrder order = CustomerOrderFactory.createOrder(buyer, orderItems, paymentMethod, shippingAddress);

        // CRITICAL: Update stock for each product before saving order
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() != null && item.getQuantity() != null) {
                    // Get the product from database to ensure we have the latest stock
                    Product product = productRepository.findById(item.getProduct().getProductId())
                            .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getProductId()));

                    // Check if enough stock exists
                    if (product.getStock() < item.getQuantity()) {
                        throw new RuntimeException("Insufficient stock for product: " + product.getName() +
                                ". Available: " + product.getStock() + ", Requested: " + item.getQuantity());
                    }

                    // Update stock
                    int newStock = product.getStock() - item.getQuantity();
                    product.setStock(newStock);
                    productRepository.save(product);

                    System.out.println(" Updated stock for " + product.getName() + ": " +
                            product.getStock() + " -> " + newStock);
                }
            }
        }

        // Then save the order
        CustomerOrder savedOrder = orderRepository.save(order);
        return savedOrder;
    }

    // NEW: Method to check if order can be fulfilled (all items in stock)
    @Transactional(readOnly = true)
    public boolean canFulfillOrder(List<OrderItem> orderItems) {
        if (orderItems == null || orderItems.isEmpty()) {
            return false;
        }

        for (OrderItem item : orderItems) {
            if (item.getProduct() != null && item.getQuantity() != null) {
                Product product = productRepository.findById(item.getProduct().getProductId()).orElse(null);
                if (product == null || product.getStock() < item.getQuantity()) {
                    return false;
                }
            }
        }
        return true;
    }

    // NEW: Method to get order summary with stock validation
    @Transactional(readOnly = true)
    public String getOrderStockValidationSummary(List<OrderItem> orderItems) {
        if (orderItems == null || orderItems.isEmpty()) {
            return "No items in order";
        }

        StringBuilder summary = new StringBuilder();
        for (OrderItem item : orderItems) {
            if (item.getProduct() != null && item.getQuantity() != null) {
                Product product = productRepository.findById(item.getProduct().getProductId()).orElse(null);
                if (product == null) {
                    summary.append(" Product not found: ").append(item.getProduct().getProductId()).append("\n");
                } else if (product.getStock() < item.getQuantity()) {
                    summary.append(" Insufficient stock for ").append(product.getName())
                            .append(": Available ").append(product.getStock())
                            .append(", Requested ").append(item.getQuantity()).append("\n");
                } else {
                    summary.append(" ").append(product.getName())
                            .append(": Available ").append(product.getStock())
                            .append(", Requested ").append(item.getQuantity()).append("\n");
                }
            }
        }
        return summary.toString();
    }

}
