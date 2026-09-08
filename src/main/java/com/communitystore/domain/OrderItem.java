package com.communitystore.domain;


import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "order_item")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long orderItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    @JsonBackReference
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private CustomerOrder order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Product product;

    private Integer quantity;
    private Double unitPrice;
    private Double subtotal;

    protected OrderItem() {}

    private OrderItem(Builder builder) {
        this.orderItemId = builder.orderItemId;
        this.order = builder.order;
        this.product = builder.product;
        this.quantity = builder.quantity;
        this.unitPrice = builder.unitPrice;
        this.subtotal = builder.subtotal != null ? builder.subtotal : builder.quantity * builder.unitPrice;
    }

    // Getters
    public Long getOrderItemId() { return orderItemId; }
    public CustomerOrder getOrder() { return order; }
    public Product getProduct() { return product; }
    public Integer getQuantity() { return quantity; }
    public Double getUnitPrice() { return unitPrice; }
    public Double getSubtotal() { return subtotal; }

    // Setters
    public void setOrder(CustomerOrder order) { this.order = order; }
    public void setProduct(Product product) { this.product = product; }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
        calculateSubtotal();
    }

    public void setUnitPrice(Double unitPrice) {
        this.unitPrice = unitPrice;
        calculateSubtotal();
    }

    private void calculateSubtotal() {
        if (this.quantity != null && this.unitPrice != null) {
            this.subtotal = this.quantity * this.unitPrice;
        }
    }

    public static class Builder {
        private Long orderItemId;
        private CustomerOrder order;
        private Product product;
        private Integer quantity;
        private Double unitPrice;
        private Double subtotal;

        public Builder setOrderItemId(Long orderItemId) { this.orderItemId = orderItemId; return this; }
        public Builder setOrder(CustomerOrder order) { this.order = order; return this; }
        public Builder setProduct(Product product) { this.product = product; return this; }
        public Builder setQuantity(Integer quantity) { this.quantity = quantity; return this; }
        public Builder setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; return this; }
        public Builder setSubtotal(Double subtotal) { this.subtotal = subtotal; return this; }

        public Builder copy(OrderItem orderItem) {
            this.orderItemId = orderItem.orderItemId;
            this.order = orderItem.order;
            this.product = orderItem.product;
            this.quantity = orderItem.quantity;
            this.unitPrice = orderItem.unitPrice;
            this.subtotal = orderItem.subtotal;
            return this;
        }

        public OrderItem build() {
            if (quantity == null || unitPrice == null)
                throw new IllegalArgumentException("Quantity and unit price are required");
            return new OrderItem(this);
        }
    }

    @Override
    public String toString() {
        return "OrderItem{" +
                "orderItemId=" + orderItemId +
                ", product=" + (product != null ? product.getName() : "null") +
                ", quantity=" + quantity +
                ", unitPrice=" + unitPrice +
                ", subtotal=" + subtotal +
                '}';
    }
}
