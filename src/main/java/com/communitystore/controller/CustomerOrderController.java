package com.communitystore.controller;

import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.OrderItem;
import com.communitystore.factory.CustomerOrderFactory;
import com.communitystore.service.ICustomerOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/orders")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class CustomerOrderController {

    @Autowired
    private ICustomerOrderService orderService;

    /**
     * Creates an order from checkout details.
     *
     * Returns a JSON message on failure so the checkout screen can
     * tell the buyer exactly what went wrong (for example an item
     * that sold out while they were paying).
     */
    @PostMapping("/create")
    public ResponseEntity<?> createOrderFromDetails(@RequestBody OrderRequest request) {
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
            return ResponseEntity.badRequest().body(Map.of("message", String.valueOf(e.getMessage())));
        } catch (RuntimeException e) {
            // Stock problems are raised as RuntimeException by the service.
            System.err.println(" Order could not be fulfilled: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", String.valueOf(e.getMessage())));
        } catch (Exception e) {
            System.err.println(" Error creating order: " + e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "We couldn't place this order. Please try again."));
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
    /**
     * Returns orders that contain listings belonging to this seller.
     */
    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<?> getSellerOrders(@PathVariable Long sellerId) {
        try {
            return ResponseEntity.ok(orderService.getOrdersForSeller(sellerId));
        } catch (Exception e) {
            System.err.println("Error fetching seller orders: " + e.getMessage());

            return ResponseEntity.badRequest().body(
                    Map.of("message", "Could not load seller orders.")
            );
        }
    }

    /**
     * Seller accepts or rejects a pending order.
     *
     * Expected request:
     * {
     *   "sellerId": 12,
     *   "decision": "ACCEPT"
     * }
     *
     * decision can be: ACCEPT or REJECT.
     */
    @PostMapping("/{orderId}/seller-decision")
    public ResponseEntity<?> respondToOrder(
            @PathVariable Long orderId,
            @RequestBody SellerDecisionRequest request
    ) {
        try {
            if (request == null
                    || request.getSellerId() == null
                    || request.getDecision() == null) {
                return ResponseEntity.badRequest().body(
                        Map.of("message", "Seller ID and decision are required.")
                );
            }

            CustomerOrder updated = orderService.respondToOrder(
                    orderId,
                    request.getSellerId(),
                    request.getDecision()
            );

            return ResponseEntity.ok(updated);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(
                    Map.of("message", String.valueOf(e.getMessage()))
            );
        } catch (Exception e) {
            System.err.println("Error responding to order: " + e.getMessage());

            return ResponseEntity.internalServerError().body(
                    Map.of("message", "Could not update this order.")
            );
        }
    }

    public static class SellerDecisionRequest {

        private Long sellerId;
        private String decision;

        public SellerDecisionRequest() {
        }

        public Long getSellerId() {
            return sellerId;
        }

        public void setSellerId(Long sellerId) {
            this.sellerId = sellerId;
        }

        public String getDecision() {
            return decision;
        }

        public void setDecision(String decision) {
            this.decision = decision;
        }
    }

}
