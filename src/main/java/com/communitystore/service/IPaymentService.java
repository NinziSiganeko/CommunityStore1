package com.communitystore.service;

import com.communitystore.domain.Payment;
import com.communitystore.domain.PaymentMethod;

import java.util.List;

public interface IPaymentService  extends IService<Payment, Long>{

    List<Payment> getAll();

    Payment findByOrderId(Long orderId);

    Payment confirmOrderPayment(
            Long orderId,
            PaymentMethod method,
            String paymentDetails,
            String payoutType,
            Boolean handoverConfirmed
    );
}