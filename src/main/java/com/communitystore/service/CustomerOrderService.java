package com.communitystore.service;

import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.domain.Product;
import com.communitystore.factory.CustomerOrderFactory;
import com.communitystore.repository.CustomerOrderRepository;
import com.communitystore.repository.ProductRepository;
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

    @Override
    @Transactional
    public CustomerOrder create(CustomerOrder order) {
        // Generate order number if missing
        if (order.getOrderNumber() == null || order.getOrderNumber().isEmpty()) {
            order.setOrderNumber(Helper.generateOrderNumber());
        }

        // Set order date if missing
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDateTime.now());
        }

        // Calculate total if missing
        if (order.getTotalAmount() == null) {
            order.setTotalAmount(order.calculateTotal());
        }

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

        // Ensure all order items are properly linked to this order
        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                item.setOrder(order);
            }
        }

        // Save the order
        CustomerOrder savedOrder = orderRepository.save(order);
        return savedOrder;
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
