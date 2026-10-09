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

        if (order == null || order.getBuyer() == null
                || order.getBuyer().getUserId() == null) {
            throw new IllegalArgumentException(
                    "Order and buyer details are required"
            );
        }

        User buyer = userRepository
                .findById(order.getBuyer().getUserId())
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

        Long sellerId = null;

        for (OrderItem item : order.getOrderItems()) {

            if (item.getProduct() == null
                    || item.getProduct().getProductId() == null) {
                throw new IllegalArgumentException(
                        "Each order item must contain a valid product"
                );
            }

            if (item.getQuantity() == null || item.getQuantity() <= 0) {
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
                        "This vendor must be verified before products can be purchased"
                );
            }

            // One order has one seller because the order has one status.
            Long currentSellerId = product.getSeller().getUserId();

            if (sellerId == null) {
                sellerId = currentSellerId;
            } else if (!sellerId.equals(currentSellerId)) {
                throw new IllegalArgumentException(
                        "Please place separate orders for items from different sellers"
                );
            }

            // Check stock now, but do not deduct it until the seller accepts.
            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Insufficient stock for " + product.getName()
                                + ". Available: " + product.getStock()
                                + ", requested: " + item.getQuantity()
                );
            }

            item.setProduct(product);
            item.setUnitPrice(product.getPrice());
            item.setOrder(order);
        }

        order.setTotalAmount(order.calculateTotal());

        if (order.getOrderNumber() == null
                || order.getOrderNumber().isBlank()) {
            order.setOrderNumber(Helper.generateOrderNumber());
        }

        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDateTime.now());
        }

        // The seller has not accepted the request yet.
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

        CustomerOrder order = orderRepository.findById(orderId).orElse(null);

        if (order == null) {
            return false;
        }

        // Stock was deducted only for accepted orders.
        if ("CONFIRMED".equals(order.getStatus())
                && order.getOrderItems() != null) {

            for (OrderItem item : order.getOrderItems()) {
                if (item.getProduct() == null || item.getQuantity() == null) {
                    continue;
                }

                Product product = productRepository
                        .findById(item.getProduct().getProductId())
                        .orElse(null);

                if (product != null) {
                    product.setStock(product.getStock() + item.getQuantity());
                    productRepository.save(product);
                }
            }
        }

        orderRepository.delete(order);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CustomerOrder> getOrdersForSeller(Long sellerId) {

        if (sellerId == null) {
            throw new IllegalArgumentException("Seller ID is required");
        }

        // Creation now prevents mixed-seller orders, so these are
        // the orders the seller can respond to.
        return orderRepository.findOrdersForSeller(sellerId);
    }

    @Override
    @Transactional
    public CustomerOrder respondToOrder(
            Long orderId,
            Long sellerId,
            String decision
    ) {

        if (orderId == null || sellerId == null || decision == null) {
            throw new IllegalArgumentException(
                    "Order, seller and decision are required"
            );
        }

        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found")
                );

        if (!"PENDING_SELLER_CONFIRMATION".equals(order.getStatus())) {
            throw new IllegalArgumentException(
                    "This order has already been processed"
            );
        }

        if (order.getOrderItems() == null || order.getOrderItems().isEmpty()) {
            throw new IllegalArgumentException("This order has no items");
        }

        // Verify that every item in this order belongs to the responding seller.
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();

            if (product == null
                    || product.getSeller() == null
                    || !sellerId.equals(product.getSeller().getUserId())) {
                throw new IllegalArgumentException(
                        "You cannot respond to an order belonging to another seller"
                );
            }
        }

        String normalisedDecision = decision.trim().toUpperCase();

        if ("REJECT".equals(normalisedDecision)
                || "REJECTED".equals(normalisedDecision)) {

            order.setStatus("REJECTED");

            // No stock is returned here because it was never deducted.
            return orderRepository.save(order);
        }

        if (!"ACCEPT".equals(normalisedDecision)
                && !"ACCEPTED".equals(normalisedDecision)
                && !"CONFIRM".equals(normalisedDecision)
                && !"CONFIRMED".equals(normalisedDecision)) {
            throw new IllegalArgumentException(
                    "Decision must be ACCEPT or REJECT"
            );
        }

        // Recheck stock at acceptance time because it may have changed
        // since the buyer first placed the order.
        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository
                    .findById(item.getProduct().getProductId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "A product in this order no longer exists"
                            )
                    );

            if (product.getStock() < item.getQuantity()) {
                throw new IllegalArgumentException(
                        "Not enough stock remains for " + product.getName()
                );
            }
        }

        // Deduct stock only after all items pass validation.
        for (OrderItem item : order.getOrderItems()) {
            Product product = productRepository
                    .findById(item.getProduct().getProductId())
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "A product in this order no longer exists"
                            )
                    );

            product.setStock(product.getStock() - item.getQuantity());
            productRepository.save(product);
        }

        order.setStatus("CONFIRMED");

        // CONFIRMED means the seller accepted the order, not that payment
        // was received. Cash/EFT must remain pending until paid.
        return orderRepository.save(order);
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
    public CustomerOrder createOrderFromDetails(
            User buyer,
            List<OrderItem> orderItems,
            String paymentMethod,
            String shippingAddress
    ) {
        CustomerOrder order = CustomerOrderFactory.createOrder(
                buyer,
                orderItems,
                paymentMethod,
                shippingAddress
        );

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



        return create(order);
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
