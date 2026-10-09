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
     * Creates an offline payment record for an existing order.
     *
     * The record remains PENDING because the application does not
     * yet receive a verified result from a live payment gateway.
     */
    @Override
    @Transactional
    public Payment create(Payment payment) {

        if (payment == null) {
            throw new IllegalArgumentException(
                    "Payment details are required"
            );
        }

        Long orderId = payment.getCustomerOrder() != null
                ? payment.getCustomerOrder().getOrderId()
                : null;

        if (!Helper.isValidId(orderId)) {
            throw new IllegalArgumentException(
                    "A valid order is required before recording payment"
            );
        }

        CustomerOrder order = customerOrderRepository.findById(orderId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Order not found")
                );

        if (order.getBuyer() == null
                || !Helper.isValidId(order.getBuyer().getUserId())) {
            throw new IllegalArgumentException(
                    "The order has no valid buyer"
            );
        }

        /*
         * Only these methods are enabled in the current checkout.
         * Credit/debit card and wallet options must not be recorded
         * as successful without an actual payment integration.
         */
        PaymentMethod method = payment.getMethod();

        if (method != PaymentMethod.CASH
                && method != PaymentMethod.EFT) {
            throw new IllegalArgumentException(
                    "Online payment is not available yet. Choose Cash or EFT."
            );
        }

        User buyer = userRepository.findById(
                order.getBuyer().getUserId()
        ).orElseThrow(() ->
                new IllegalArgumentException("Buyer account not found")
        );

        double amount = order.getTotalAmount() != null
                ? order.getTotalAmount()
                : 0.0;

        if (amount <= 0) {
            throw new IllegalArgumentException(
                    "The order total must be greater than zero"
            );
        }

        /*
         * Do not accept COMPLETED from the browser. For Cash and EFT,
         * Community Store has no way to independently verify that the
         * buyer has actually paid.
         */
        Payment saved = new Payment.Builder()
                .copy(payment)
                .setAmount(amount)
                .setMethod(method)
                .setStatus(PaymentStatus.PENDING)
                .setPaymentDate(LocalDateTime.now())
                .setTransactionReference(
                        Helper.generateTransactionReference()
                )
                .setBuyer(buyer)
                .setCustomerOrder(order)
                .build();

        return paymentRepository.save(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Payment read(Long paymentId) {
        return paymentRepository.findById(paymentId).orElse(null);
    }

    /*
     * Keep this service method for future gateway integration.
     * The public controller must not allow buyers to self-report a
     * payment as COMPLETED; that requires a trusted confirmation flow.
     */
    @Override
    @Transactional
    public Payment update(Payment payment) {
        throw new UnsupportedOperationException(
                "Payment status updates require a verified payment or confirmation workflow"
        );
    }

    @Override
    @Transactional
    public boolean delete(Long paymentId) {
        if (!paymentRepository.existsById(paymentId)) {
            return false;
        }

        paymentRepository.deleteById(paymentId);
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Payment> getAll() {
        return paymentRepository.findAll();
    }
}