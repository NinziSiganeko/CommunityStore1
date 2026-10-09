package com.communitystore.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long paymentId;
    private double amount;

    @Enumerated(EnumType.STRING)
    private PaymentMethod method;

    private LocalDateTime paymentDate;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private String transactionReference;

    @Column(length = 60)
    private String payoutType;

    @Column(length = 255)
    private String paymentDetails;

    @Column(nullable = false)
    private boolean handoverConfirmed = false;

    @OneToOne
    @JoinColumn(name = "order_id")
    private CustomerOrder customerOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User buyer;

    protected Payment() {
    }

    public Payment(Builder builder) {
        this.paymentId = builder.paymentId;
        this.amount = builder.amount;
        this.method = builder.method;
        this.paymentDate = builder.paymentDate;
        this.status = builder.status;
        this.transactionReference = builder.transactionReference;
        this.payoutType = builder.payoutType;
        this.paymentDetails = builder.paymentDetails;
        this.handoverConfirmed = builder.handoverConfirmed;
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

    public void setMethod(PaymentMethod method) {
        this.method = method;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
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

    public String getPayoutType() {
        return payoutType;
    }

    public void setPayoutType(String payoutType) {
        this.payoutType = payoutType;
    }

    public String getPaymentDetails() {
        return paymentDetails;
    }

    public void setPaymentDetails(String paymentDetails) {
        this.paymentDetails = paymentDetails;
    }

    public boolean isHandoverConfirmed() {
        return handoverConfirmed;
    }

    public void setHandoverConfirmed(boolean handoverConfirmed) {
        this.handoverConfirmed = handoverConfirmed;
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
                ", payoutType='" + payoutType + '\'' +
                ", paymentDetails='" + paymentDetails + '\'' +
                ", handoverConfirmed=" + handoverConfirmed +
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
        private String payoutType;
        private String paymentDetails;
        private boolean handoverConfirmed;
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

        public Builder setPayoutType(String payoutType) {
            this.payoutType = payoutType;
            return this;
        }

        public Builder setPaymentDetails(String paymentDetails) {
            this.paymentDetails = paymentDetails;
            return this;
        }

        public Builder setHandoverConfirmed(boolean handoverConfirmed) {
            this.handoverConfirmed = handoverConfirmed;
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
            this.payoutType = payment.payoutType;
            this.paymentDetails = payment.paymentDetails;
            this.handoverConfirmed = payment.handoverConfirmed;
            this.buyer = payment.buyer;
            this.customerOrder = payment.customerOrder;
            return this;
        }

        public Payment build() {
            return new Payment(this);
        }
    }
}
