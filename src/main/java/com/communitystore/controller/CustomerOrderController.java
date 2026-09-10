package com.communitystore.controller;


import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.factory.CustomerOrderFactory;
import com.communitystore.service.ICustomerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = "http://localhost:3000") // Add CORS for frontend
public class CustomerOrderController {

    @Autowired
    private ICustomerOrderService orderService;

    // NEW: Create order using factory pattern (recommended)
    @PostMapping("/create")
    public ResponseEntity<CustomerOrder> createOrderFromDetails(@RequestBody OrderRequest request) {
        try {
            System.out.println("Creating order for buyer: " +
                    (request.getBuyer() != null ? request.getBuyer().getUserId() : "null"));

            CustomerOrder order = CustomerOrderFactory.createOrder(
                    request.getBuyer(),
                    request.getOrderItems(),
                    request.getPaymentMethod(),
                    request.getShippingAddress()
            );

            CustomerOrder createdOrder = orderService.create(order);
            System.out.println(" Order created successfully: " + createdOrder.getOrderNumber());
            return ResponseEntity.ok(createdOrder);
        } catch (IllegalArgumentException e) {
            System.err.println(" Validation error creating order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println(" Error creating order: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Keep existing direct create endpoint for backward compatibility
    @PostMapping
    public ResponseEntity<CustomerOrder> createOrder(@RequestBody CustomerOrder order) {
        try {
            System.out.println("Creating order directly for buyer: " +
                    (order.getBuyer() != null ? order.getBuyer().getUserId() : "null"));

            CustomerOrder createdOrder = orderService.create(order);
            return ResponseEntity.ok(createdOrder);
        } catch (Exception e) {
            System.err.println(" Error creating order directly: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<CustomerOrder> getOrder(@PathVariable Long orderId) {
        try {
            CustomerOrder order = orderService.read(orderId);
            if (order != null) {
                return ResponseEntity.ok(order);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(" Error fetching order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/buyer/{userId}")
    public ResponseEntity<List<CustomerOrder>> getBuyerOrders(@PathVariable Long userId) {
        try {
            System.out.println("Fetching orders for buyer ID: " + userId);
            List<CustomerOrder> orders = orderService.getOrdersByBuyerId(userId);
            System.out.println("Found " + orders.size() + " orders for buyer: " + userId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println("Error fetching buyer orders: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/number/{orderNumber}")
    public ResponseEntity<CustomerOrder> getOrderByNumber(@PathVariable String orderNumber) {
        try {
            CustomerOrder order = orderService.getOrderByOrderNumber(orderNumber);
            if (order != null) {
                return ResponseEntity.ok(order);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(" Error fetching order by number: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{orderId}")
    public ResponseEntity<CustomerOrder> updateOrder(@PathVariable Long orderId, @RequestBody CustomerOrder order) {
        try {
            order.setOrderId(orderId);
            CustomerOrder updatedOrder = orderService.update(order);
            if (updatedOrder != null) {
                return ResponseEntity.ok(updatedOrder);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(" Error updating order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{orderId}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Long orderId) {
        try {
            boolean deleted = orderService.delete(orderId);
            if (deleted) {
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println(" Error deleting order: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<CustomerOrder>> getAllOrders() {
        try {
            List<CustomerOrder> orders = orderService.getAll();
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println(" Error fetching all orders: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    // Request DTO for factory-based order creation
    public static class OrderRequest {
        private User buyer;
        private List<OrderItem> orderItems;
        private String paymentMethod;
        private String shippingAddress;

        // Default constructor
        public OrderRequest() {}

        // All args constructor
        public OrderRequest(User buyer, List<OrderItem> orderItems, String paymentMethod, String shippingAddress) {
            this.buyer = buyer;
            this.orderItems = orderItems;
            this.paymentMethod = paymentMethod;
            this.shippingAddress = shippingAddress;
        }

        // Getters and setters
        public User getBuyer() {
            return buyer;
        }

        public void setBuyer(User buyer) {
            this.buyer = buyer;
        }

        public List<OrderItem> getOrderItems() {
            return orderItems;
        }

        public void setOrderItems(List<OrderItem> orderItems) {
            this.orderItems = orderItems;
        }

        public String getPaymentMethod() {
            return paymentMethod;
        }

        public void setPaymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }

        public String getShippingAddress() {
            return shippingAddress;
        }

        public void setShippingAddress(String shippingAddress) {
            this.shippingAddress = shippingAddress;
        }

        @Override
        public String toString() {
            return "OrderRequest{" +
                    "buyer=" + (buyer != null ? buyer.getUserId() : "null") +
                    ", orderItems=" + (orderItems != null ? orderItems.size() : 0) +
                    ", paymentMethod='" + paymentMethod + '\'' +
                    ", shippingAddress='" + shippingAddress + '\'' +
                    '}';
        }
    }

}
