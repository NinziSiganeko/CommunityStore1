package com.communitystore.service;


import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.Payment;
import com.communitystore.domain.PaymentMethod;
import com.communitystore.domain.PaymentStatus;
import com.communitystore.repository.CustomerOrderRepository;
import com.communitystore.repository.UserRepository;
import com.communitystore.repository.PaymentRepository;
import com.communitystore.util.Helper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import java.util.List;

@Service
public class PaymentService implements IPaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerOrderRepository customerOrderRepository;

    /**
     * Records a payment for an order that already exists.
     *
     * Previously this method created a brand new order for every
     * payment, which meant the payment was never linked to the
     * checkout that produced it. The order is now looked up and
     * reused, and the buyer is taken from the order when the
     * request does not repeat it.
     */
    @Override
    @Transactional
    public Payment create(Payment payment) {
        if (payment == null) {
            throw new IllegalArgumentException("Payment details are required.");
        }

        Long orderId = payment.getCustomerOrder() != null
                ? payment.getCustomerOrder().getOrderId()
                : null;

        if (!Helper.isValidId(orderId)) {
            throw new IllegalArgumentException("A valid order is required before taking payment.");
        }

        CustomerOrder customerOrder = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        Long buyerId = payment.getBuyer() != null
                ? payment.getBuyer().getUserId()
                : null;

        if (buyerId == null && customerOrder.getBuyer() != null) {
            buyerId = customerOrder.getBuyer().getUserId();
        }

        if (!Helper.isValidId(buyerId)) {
            throw new IllegalArgumentException("Buyer information missing in payment request.");
        }

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        double amount = payment.getAmount() > 0
                ? payment.getAmount()
                : (customerOrder.getTotalAmount() != null ? customerOrder.getTotalAmount() : 0.0);

        if (amount <= 0) {
            throw new IllegalArgumentException("Payment amount must be greater than zero.");
        }

        PaymentStatus status = payment.getStatus() != null
                ? payment.getStatus()
                : PaymentStatus.COMPLETED;

        Payment saved = new Payment.Builder()
                .copy(payment)
                .setAmount(amount)
                .setMethod(payment.getMethod() != null ? payment.getMethod() : PaymentMethod.EFT)
                .setStatus(status)
                .setPaymentDate(payment.getPaymentDate() != null
                        ? payment.getPaymentDate()
                        : LocalDateTime.now())
                .setTransactionReference(payment.getTransactionReference() != null
                        ? payment.getTransactionReference()
                        : Helper.generateTransactionReference())
                .setBuyer(buyer)
                .setCustomerOrder(customerOrder)
                .build();

        return paymentRepository.save(saved);
    }
    @Override
    public Payment read(Long paymentId) {
        return paymentRepository.findById(paymentId).orElse(null);
    }

    @Override
    public Payment update(Payment payment) {
        return paymentRepository.save(payment);
    }

    @Override
    public boolean delete(Long paymentId) {
        paymentRepository.deleteById(paymentId);
        return true;
    }

    @Override
    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }
}

