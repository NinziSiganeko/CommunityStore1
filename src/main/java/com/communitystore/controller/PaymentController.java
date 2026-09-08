package com.communitystore.controller;

import com.communitystore.domain.Payment;
import com.communitystore.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/payment")
//@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService service;

    @Autowired
    public PaymentController(PaymentService service) {
        this.service = service;
    }
    @PostMapping("/create")
    public ResponseEntity<?> create(@RequestBody Payment payment) {
        try {
            Payment created = service.create(payment);

            // Return a detailed success response
            Map<String, Object> response = new HashMap<>();
            response.put("paymentId", created.getPaymentId());
            response.put("transactionReference", created.getTransactionReference());
            response.put("status", created.getStatus());
            response.put("amount", created.getAmount());
            response.put("orderId", created.getCustomerOrder().getOrderId());
            response.put("orderDate", created.getCustomerOrder().getOrderDate());
            response.put("customerName", created.getCustomer().getFirstName() + " " + created.getCustomer().getLastName());
            response.put("customerEmail", created.getCustomer().getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
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