package com.communitystore.controller;

import com.communitystore.domain.Payment;
import com.communitystore.domain.PaymentMethod;
import com.communitystore.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    private final PaymentService service;

    @Autowired
    public PaymentController(PaymentService service) {
        this.service = service;
    }

    private Map<String, Object> toResponseMap(Payment payment) {
        Map<String, Object> response = new HashMap<>();
        response.put("paymentId", payment.getPaymentId());
        response.put("transactionReference", payment.getTransactionReference());
        response.put("status", payment.getStatus());
        response.put("method", payment.getMethod());
        response.put("amount", payment.getAmount());
        response.put("paymentDate", payment.getPaymentDate());
        response.put("payoutType", payment.getPayoutType());
        response.put("paymentDetails", payment.getPaymentDetails());
        response.put("handoverConfirmed", payment.isHandoverConfirmed());

        if (payment.getCustomerOrder() != null) {
            response.put("orderId", payment.getCustomerOrder().getOrderId());
            response.put("orderDate", payment.getCustomerOrder().getOrderDate());
        }

        if (payment.getBuyer() != null) {
            response.put("buyerName", payment.getBuyer().getFirstName() + " " + payment.getBuyer().getLastName());
            response.put("buyerEmail", payment.getBuyer().getEmail());
        }

        return response;
    }

    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Payment payment) {
        try {
            Payment created = service.create(payment);
            return ResponseEntity.ok(toResponseMap(created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", String.valueOf(e.getMessage())));
        }
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getByOrder(@PathVariable Long orderId) {
        Payment payment = service.findByOrderId(orderId);
        if (payment == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toResponseMap(payment));
    }

    @PutMapping("/order/{orderId}/confirm")
    public ResponseEntity<?> confirmOrderPayment(
            @PathVariable Long orderId,
            @RequestBody(required = false) Map<String, Object> payload
    ) {
        try {
            PaymentMethod method = null;
            String paymentDetails = null;
            String payoutType = null;
            Boolean handoverConfirmed = true;

            if (payload != null) {
                Object rawMethod = payload.get("method");
                if (rawMethod != null && !String.valueOf(rawMethod).isBlank()) {
                    method = PaymentMethod.valueOf(String.valueOf(rawMethod).trim().toUpperCase());
                }
                if (payload.get("paymentDetails") != null) {
                    paymentDetails = String.valueOf(payload.get("paymentDetails"));
                }
                if (payload.get("payoutType") != null) {
                    payoutType = String.valueOf(payload.get("payoutType"));
                }
                if (payload.get("handoverConfirmed") instanceof Boolean) {
                    handoverConfirmed = (Boolean) payload.get("handoverConfirmed");
                }
            }

            Payment updated = service.confirmOrderPayment(
                    orderId,
                    method,
                    paymentDetails,
                    payoutType,
                    handoverConfirmed
            );

            return ResponseEntity.ok(toResponseMap(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", String.valueOf(e.getMessage())));
        }
    }

    @GetMapping("/read/{paymentId}")
    public Payment read(@PathVariable Long paymentId) {
        return this.service.read(paymentId);
    }

    @PostMapping("/update")
    public Payment update(@RequestBody Payment payment) {
        return this.service.update(payment);
    }

    @DeleteMapping("/delete/{paymentId}")
    public boolean delete(@PathVariable Long paymentId) {
        return service.delete(paymentId);
    }

    @GetMapping("/getAll")
    public List<Payment> getAll() {
        return this.service.getAll();
    }
}
