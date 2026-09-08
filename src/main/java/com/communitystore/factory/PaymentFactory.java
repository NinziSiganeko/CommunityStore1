package com.communitystore.factory;



import com.communitystore.domain.Payment;
import com.communitystore.domain.PaymentMethod;
import com.communitystore.domain.PaymentStatus;
import com.communitystore.util.Helper;

import java.time.LocalDateTime;

public class PaymentFactory {

    public static Payment createPayment(double amount, PaymentMethod method,
                                        PaymentStatus status, String transactionReference,
                                        String cardNumber, LocalDateTime paymentDate)
    {
        if (!Helper.isValidAmount(amount)) {
            System.out.println("Invalid amount: " + amount);
            return null;
        }
        if (method == PaymentMethod.CREDIT_CARD || method == PaymentMethod.DEBIT_CARD) {
            if (!Helper.isValidCard(cardNumber)) {
                System.out.println("Invalid card number: " + cardNumber);
                return null;
            }
        }
        if (method == PaymentMethod.EFT) {
            if (!Helper.isValidBankAccount(transactionReference)) {
                System.out.println("Invalid EFT account/transaction reference: " + transactionReference);
                return null;
            }
        }
        LocalDateTime date = Helper.getCurrentDateTime();

        return new Payment.Builder()
                .setAmount(amount)
                .setMethod(method)
                .setStatus(status)
                .setTransactionReference(transactionReference)
                .setPaymentDate(date)
                .build();
    }
}