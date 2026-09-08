package com.communitystore.controller;


import com.communitystore.domain.Customer;
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
            System.out.println(" Creating order via factory for customer: " +
                    (request.getCustomer() != null ? request.getCustomer().getUserId() : "null"));

            CustomerOrder order = CustomerOrderFactory.createOrder(
                    request.getCustomer(),
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
            System.out.println(" Creating order directly: " +
                    (order.getCustomer() != null ? order.getCustomer().getUserId() : "null"));

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

    @GetMapping("/customer/{userId}")
    public ResponseEntity<List<CustomerOrder>> getCustomerOrders(@PathVariable Long userId) {
        try {
            System.out.println(" Fetching orders for user ID: " + userId);
            List<CustomerOrder> orders = orderService.getOrdersByCustomerId(userId);
            System.out.println(" Found " + orders.size() + " orders for user: " + userId);
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            System.err.println(" Error fetching customer orders: " + e.getMessage());
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
        private Customer customer;
        private List<OrderItem> orderItems;
        private String paymentMethod;
        private String shippingAddress;

        // Default constructor
        public OrderRequest() {}

        // All args constructor
        public OrderRequest(Customer customer, List<OrderItem> orderItems, String paymentMethod, String shippingAddress) {
            this.customer = customer;
            this.orderItems = orderItems;
            this.paymentMethod = paymentMethod;
            this.shippingAddress = shippingAddress;
        }

        // Getters and setters
        public Customer getCustomer() {
            return customer;
        }

        public void setCustomer(Customer customer) {
            this.customer = customer;
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
                    "customer=" + (customer != null ? customer.getUserId() : "null") +
                    ", orderItems=" + (orderItems != null ? orderItems.size() : 0) +
                    ", paymentMethod='" + paymentMethod + '\'' +
                    ", shippingAddress='" + shippingAddress + '\'' +
                    '}';
        }
    }

}
