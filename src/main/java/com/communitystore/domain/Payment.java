package com.communitystore.domain;


import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    private double amount;
    private PaymentMethod method;
    private LocalDateTime paymentDate;
    private PaymentStatus status;
    private String transactionReference;

    @OneToOne
    @JoinColumn(name = "order_id")
    private CustomerOrder customerOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User buyer;

    protected Payment() {
    }

    public Payment(Builder builder){
        this.paymentId = builder.paymentId;
        this.amount = builder.amount;
        this.method = builder.method;
        this.paymentDate = builder.paymentDate;
        this.status = builder.status;
        this.transactionReference = builder.transactionReference;
        this.buyer = builder.buyer;
        this.customerOrder = builder.customerOrder;
    }

    public Long getPaymentId() {
        return paymentId;
    }
    public double getAmount() {
        return amount;
    }
    public PaymentMethod getMethod() {
        return method;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }
    public PaymentStatus getStatus() {
        return status;
    }
    public CustomerOrder getCustomerOrder() {
        return customerOrder;
    }
    public User getBuyer() {
        return buyer;
    }
    public String getTransactionReference() {
        return transactionReference;
    }
    @Override
    public String toString() {
        return "Payment{" +
                "paymentId=" + paymentId +
                ", amount=" + amount +
                ", method=" + method +
                ", paymentDate=" + paymentDate +
                ", status=" + status +
                ", transactionReference='" + transactionReference + '\'' +
                ", customerOrder=" + customerOrder +
                ", buyer=" + buyer +
                '}';
    }
    public static class Builder {
        private Long paymentId;
        private double amount;
        private PaymentMethod method;
        private LocalDateTime paymentDate;
        private PaymentStatus status;
        private String transactionReference;
        private User buyer;
        private CustomerOrder customerOrder;

        public Builder setPaymentId(Long paymentId) {
            this.paymentId = paymentId;
            return this;
        }
        public Builder setAmount(double amount) {
            this.amount = amount;
            return this;
        }
        public Builder setMethod(PaymentMethod method) {
            this.method = method;
            return this;
        }
        public Builder setPaymentDate(LocalDateTime paymentDate) {
            this.paymentDate = paymentDate;
            return this;
        }
        public Builder setStatus(PaymentStatus status) {
            this.status = status;
            return this;
        }
        public Builder setTransactionReference(String transactionReference) {
            this.transactionReference = transactionReference;
            return this;
        }
        public Builder setCustomerOrder(CustomerOrder customerOrder) {
            this.customerOrder = customerOrder;
            return this;
        }
        public Builder setBuyer(User buyer) {
            this.buyer = buyer;
            return this;
        }
        public Builder copy(Payment payment) {
            this.paymentId = payment.paymentId;
            this.amount = payment.amount;
            this.method = payment.method;
            this.paymentDate = payment.paymentDate;
            this.status = payment.status;
            this.transactionReference = payment.transactionReference;
            this.buyer = payment.buyer;
            this.customerOrder = payment.customerOrder;
            return this;
        }
        public Payment build() {
            return new Payment(this);
        }
    }
}
