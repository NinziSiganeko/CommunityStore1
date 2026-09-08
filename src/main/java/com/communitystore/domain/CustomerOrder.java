package com.communitystore.domain;


import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_order")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_number")
    private String orderNumber;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    private Double totalAmount;

//    @Column(name = "status")
//    private String status = "CONFIRMED";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnoreProperties({"orders", "hibernateLazyInitializer", "handler"})
    private Customer customer;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> orderItems = new ArrayList<>();

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "shipping_address")
    private String shippingAddress;

    protected CustomerOrder() {}

    private CustomerOrder(Builder builder) {
        this.orderId = builder.orderId;
        this.orderNumber = builder.orderNumber;
        this.orderDate = builder.orderDate;
        this.totalAmount = builder.totalAmount;
        //this.status = builder.status;
        this.customer = builder.customer;
        this.orderItems = builder.orderItems;
        this.paymentMethod = builder.paymentMethod;
        this.shippingAddress = builder.shippingAddress;

        // Set order reference in each item
        if (this.orderItems != null) {
            for (OrderItem item : this.orderItems) {
                item.setOrder(this);
            }
        }
    }

    // ========== Getters ==========
    public Long getOrderId() { return orderId; }
    public String getOrderNumber() { return orderNumber; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public Double getTotalAmount() { return totalAmount; }
    //public String getStatus() { return status; }
    public Customer getCustomer() { return customer; }
    public List<OrderItem> getOrderItems() { return orderItems; }
    public String getPaymentMethod() { return paymentMethod; }
    public String getShippingAddress() { return shippingAddress; }

    // ========== Setters ==========
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    // public void setStatus(String status) { this.status = status; }
    public void setCustomer(Customer customer) { this.customer = customer; }
    public void setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public void setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; }

    public String getCustomerName() {
        return customer != null ? customer.getFirstName() + " " + customer.getLastName() : null;
    }

    public String getCustomerEmail() {
        return customer != null ? customer.getEmail() : null;
    }

    public Long getCustomerId() {
        return customer != null ? customer.getUserId() : null;
    }

    public double calculateTotal() {
        if (orderItems == null || orderItems.isEmpty()) return 0.0;
        return orderItems.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();
    }

    // Builder Pattern
    public static class Builder {
        private Long orderId;
        private String orderNumber;
        private LocalDateTime orderDate = LocalDateTime.now();
        private Double totalAmount;
        private String status = "CONFIRMED";
        private Customer customer;
        private List<OrderItem> orderItems = new ArrayList<>();
        private String paymentMethod;
        private String shippingAddress;

        public Builder setOrderId(Long orderId) { this.orderId = orderId; return this; }
        public Builder setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; return this; }
        public Builder setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; return this; }
        public Builder setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; return this; }
        public Builder setStatus(String status) { this.status = status; return this; }
        public Builder setCustomer(Customer customer) { this.customer = customer; return this; }
        public Builder setOrderItems(List<OrderItem> orderItems) { this.orderItems = orderItems; return this; }
        public Builder setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; return this; }
        public Builder setShippingAddress(String shippingAddress) { this.shippingAddress = shippingAddress; return this; }

        public Builder addOrderItem(OrderItem item) {
            if (this.orderItems == null) this.orderItems = new ArrayList<>();
            this.orderItems.add(item);
            return this;
        }

        public Builder copy(CustomerOrder order) {
            this.orderId = order.orderId;
            this.orderNumber = order.orderNumber;
            this.orderDate = order.orderDate;
            this.totalAmount = order.totalAmount;
            //this.status = order.status;
            this.customer = order.customer;
            this.orderItems = order.orderItems;
            this.paymentMethod = order.paymentMethod;
            this.shippingAddress = order.shippingAddress;
            return this;
        }

        public CustomerOrder build() { return new CustomerOrder(this); }
    }

    @Override
    public String toString() {
        return "CustomerOrder{" +
                "orderId=" + orderId +
                ", orderNumber='" + orderNumber + '\'' +
                ", orderDate=" + orderDate +
                ", totalAmount=" + totalAmount +
                // ", status='" + status + '\'' +
                ", customerId=" + getCustomerId() +
                ", orderItems=" + (orderItems != null ? orderItems.size() : 0) +
                ", paymentMethod='" + paymentMethod + '\'' +
                ", shippingAddress='" + shippingAddress + '\'' +
                '}';
    }
}
