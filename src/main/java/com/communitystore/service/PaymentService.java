package com.communitystore.service;


import com.communitystore.domain.User;
import com.communitystore.domain.CustomerOrder;
import com.communitystore.domain.Payment;
import com.communitystore.repository.CustomerOrderRepository;
import com.communitystore.repository.UserRepository;
import com.communitystore.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    @Override
    public Payment create(Payment payment) {
        if (payment.getBuyer() == null || payment.getBuyer().getUserId() == null) {
            throw new IllegalArgumentException("Buyer information missing in payment request.");
        }
        User buyer = userRepository.findById(payment.getBuyer().getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        // Create linked order
        CustomerOrder customerOrder = new CustomerOrder.Builder()
                .setOrderDate(LocalDateTime.now())
                .setStatus("PAID")
                .build();
        // Link both sides
        payment = new Payment.Builder()
                .copy(payment)
                .setBuyer(buyer)
                .setCustomerOrder(customerOrder)
                .build();
        // Persist order first, then payment
        customerOrderRepository.save(customerOrder);
        Payment savedPayment = paymentRepository.save(payment);

        return savedPayment;
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

