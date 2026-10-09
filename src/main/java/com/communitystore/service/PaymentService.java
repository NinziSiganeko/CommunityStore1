package com.communitystore.service;

import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.Payment;
import com.communitystore.domain.PaymentMethod;
import com.communitystore.domain.PaymentStatus;
import com.communitystore.domain.User;
import com.communitystore.repository.CustomerOrderRepository;
import com.communitystore.repository.PaymentRepository;
import com.communitystore.repository.UserRepository;
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
     * Cash-on-meetup payments start in PENDING status until the
     * buyer and seller complete the handover at the agreed exchange
     * point; online payments (card, EFT, SnapScan) are recorded as
     * COMPLETED immediately.
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

        PaymentMethod method = payment.getMethod() != null
                ? payment.getMethod()
                : PaymentMethod.EFT;

        PaymentStatus status = payment.getStatus() != null
                ? payment.getStatus()
                : (method == PaymentMethod.CASH ? PaymentStatus.PENDING : PaymentStatus.COMPLETED);

        String payoutType = payment.getPayoutType() != null && !payment.getPayoutType().isBlank()
                ? payment.getPayoutType().trim()
                : (method == PaymentMethod.CASH ? "DIRECT_ON_MEETUP" : "ESCROW_PEER_PROTECTION");

        Payment saved = new Payment.Builder()
                .copy(payment)
                .setAmount(amount)
                .setMethod(method)
                .setStatus(status)
                .setPayoutType(payoutType)
                .setPaymentDetails(payment.getPaymentDetails())
                .setHandoverConfirmed(payment.isHandoverConfirmed())
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

    @Transactional(readOnly = true)
    public Payment findByOrderId(Long orderId) {
        if (!Helper.isValidId(orderId)) {
            return null;
        }

        List<Payment> matches = paymentRepository.findByCustomerOrderOrderId(orderId);

        if (matches == null || matches.isEmpty()) {
            return null;
        }

        return matches.get(matches.size() - 1);
    }

    /**
     * Completes or updates the payment for an order — used when a
     * buyer settles a Cash-on-Meetup order, switches payment method
     * after agreeing with the seller in Chat, or confirms collection
     * to release escrow funds.
     */
    @Transactional
    public Payment confirmOrderPayment(
            Long orderId,
            PaymentMethod method,
            String paymentDetails,
            String payoutType,
            Boolean handoverConfirmed
    ) {
        if (!Helper.isValidId(orderId)) {
            throw new IllegalArgumentException("Valid order ID is required.");
        }

        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found."));

        Payment existing = findByOrderId(orderId);

        if (existing == null) {
            Payment fresh = new Payment.Builder()
                    .setCustomerOrder(order)
                    .setBuyer(order.getBuyer())
                    .setAmount(order.getTotalAmount() != null ? order.getTotalAmount() : 0.0)
                    .setMethod(method != null ? method : PaymentMethod.CASH)
                    .setStatus(PaymentStatus.COMPLETED)
                    .setPayoutType(payoutType != null ? payoutType : "DIRECT_ON_MEETUP")
                    .setPaymentDetails(paymentDetails)
                    .setHandoverConfirmed(handoverConfirmed != null ? handoverConfirmed : true)
                    .setPaymentDate(LocalDateTime.now())
                    .setTransactionReference(Helper.generateTransactionReference())
                    .build();

            if (method != null) {
                order.setPaymentMethod(method.name());
                customerOrderRepository.save(order);
            }

            return paymentRepository.save(fresh);
        }

        if (method != null) {
            existing.setMethod(method);
            order.setPaymentMethod(method.name());
            customerOrderRepository.save(order);
        }

        if (paymentDetails != null && !paymentDetails.isBlank()) {
            existing.setPaymentDetails(paymentDetails.trim());
        }

        if (payoutType != null && !payoutType.isBlank()) {
            existing.setPayoutType(payoutType.trim());
        }

        if (handoverConfirmed != null) {
            existing.setHandoverConfirmed(handoverConfirmed);
        }

        existing.setStatus(PaymentStatus.COMPLETED);
        existing.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(existing);
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
