package com.communitystore.util;


import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.List;

public class Helper {

    // String validation
    public static boolean isNullOrEmpty(String s) {
        return s == null || s.trim().isEmpty();
    }

    public static boolean isValidString(String s, int minLength, int maxLength) {
        if (isNullOrEmpty(s)) return false;
        return s.length() >= minLength && s.length() <= maxLength;
    }

    // Email validation
    public static boolean isValidEmail(String email) {
        if (isNullOrEmpty(email)) {
            return false;
        }
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        return Pattern.compile(emailRegex).matcher(email).matches();
    }

    public static boolean isValidAdminEmail(String email) {
        if (isNullOrEmpty(email)) return false;
        if (!email.equals(email.toLowerCase())) return false;
        String requiredDomain = "@communitystore";
        return email.endsWith(requiredDomain);
    }

    // Password validation
    public static boolean isValidAdminPassword(String password) {
        final String ADMIN_PASSWORD = "password";
        return ADMIN_PASSWORD.equals(password);
    }

    public static boolean isValidPassword(String password) {
        if (isNullOrEmpty(password)) return false;
        String passwordRegex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$";
        return Pattern.compile(passwordRegex).matcher(password).matches();
    }

    // Numeric validation
    public static boolean isValidAmount(double amount) {
        return amount > 0 && amount <= 1000000;
    }

    public static boolean isValidQuantity(int quantity) {
        return quantity > 0 && quantity <= 1000;
    }

    public static boolean isValidRating(int rating) {
        return rating >= 1 && rating <= 5;
    }

    public static boolean isValidId(Long id) {
        return id != null && id > 0;
    }

    // Date validation
    public static LocalDateTime getCurrentDateTime() {
        return LocalDateTime.now(ZoneId.of("UTC"));
    }

    // Payment validation
    public static boolean isValidCard(String cardNumber) {
        return !isNullOrEmpty(cardNumber) && cardNumber.matches("\\d{13,19}");
    }

    public static boolean isValidBankAccount(String account) {
        return !isNullOrEmpty(account) && account.matches("\\d{6,20}");
    }

    public static boolean isValidPaymentMethod(String paymentMethod) {
        if (isNullOrEmpty(paymentMethod)) return false;
        String[] validMethods = {"CREDIT_CARD", "DEBIT_CARD", "PAYPAL", "BANK_TRANSFER", "CASH"};
        for (String method : validMethods) {
            if (method.equalsIgnoreCase(paymentMethod)) {
                return true;
            }
        }
        return false;
    }

    // Order validation - SIMPLIFIED: Only CONFIRMED status
    public static boolean isValidOrderStatus(String status) {
        return "CONFIRMED".equalsIgnoreCase(status);
    }

    public static boolean isValidAddress(String address) {
        return isValidString(address, 10, 200);
    }

    public static boolean isValidPhoneNumber(String phone) {
        if (isNullOrEmpty(phone)) return false;
        String phoneRegex = "^(\\+27|0)[0-9]{9}$";
        return Pattern.compile(phoneRegex).matcher(phone.replace(" ", "")).matches();
    }

    // Name validation
    public static boolean isValidName(String name) {
        if (isNullOrEmpty(name)) return false;
        String nameRegex = "^[a-zA-ZÀ-ÿ\\s'.-]{2,50}$";
        return Pattern.compile(nameRegex).matcher(name).matches();
    }

    // ============ ORDER-RELATED UTILITY METHODS ============

    // Order number generation - Multiple options
    public static String generateOrderNumber() {
        return "ORD-" +
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) +
                "-" + String.format("%04d", (int)(Math.random() * 10000));
    }

    // Alternative order number generation with timestamp
    public static String generateTimestampOrderNumber() {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String random = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "ORD-" + timestamp.substring(timestamp.length() - 6) + "-" + random;
    }

    // Alternative order number generation with sequential pattern
    public static String generateSequentialOrderNumber(Long orderId) {
        return "ORD-" +
                LocalDateTime.now().getYear() +
                String.format("%06d", orderId != null ? orderId : (int)(Math.random() * 1000000));
    }

    // Order validation methods
    public static boolean isValidOrderTotal(Double totalAmount) {
        return totalAmount != null && totalAmount > 0 && totalAmount <= 100000;
    }

    public static boolean hasValidOrderItems(List<?> orderItems) {
        return orderItems != null && !orderItems.isEmpty();
    }

    public static boolean isValidUser(Object user) {
        return user != null;
    }

    // Order item validation
    public static boolean isValidOrderItem(Integer quantity, Double unitPrice) {
        return quantity != null && quantity > 0 && unitPrice != null && unitPrice > 0;
    }

    public static Double calculateItemSubtotal(Integer quantity, Double unitPrice) {
        if (!isValidOrderItem(quantity, unitPrice)) {
            return 0.0;
        }
        return quantity * unitPrice;
    }

    // Stock validation
    public static boolean isValidStockUpdate(int currentStock, int quantityToDeduct) {
        return currentStock >= quantityToDeduct && quantityToDeduct > 0;
    }

    public static int calculateNewStock(int currentStock, int quantityToDeduct) {
        if (!isValidStockUpdate(currentStock, quantityToDeduct)) {
            throw new IllegalArgumentException("Invalid stock update: current=" + currentStock + ", deduct=" + quantityToDeduct);
        }
        return currentStock - quantityToDeduct;
    }

    // Order status validation (expanded)
    public static boolean isValidOrderStatusExtended(String status) {
        if (isNullOrEmpty(status)) return false;
        String[] validStatuses = {"PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"};
        for (String validStatus : validStatuses) {
            if (validStatus.equalsIgnoreCase(status)) {
                return true;
            }
        }
        return false;
    }

    // Order date validation
    public static boolean isValidOrderDate(LocalDateTime orderDate) {
        if (orderDate == null) return false;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime minDate = now.minusYears(1); // Orders can be up to 1 year
        LocalDateTime maxDate = now.plusDays(1);   // Allow for timezone differences
        return !orderDate.isBefore(minDate) && !orderDate.isAfter(maxDate);
    }

    // Payment amount validation
    public static boolean isValidPaymentAmount(Double amount) {
        return amount != null && amount >= 0 && amount <= 1000000;
    }

    // Shipping address validation
    public static boolean isValidShippingAddress(String address) {
        if (isNullOrEmpty(address)) return false;
        // Basic address validation - should contain numbers and letters
        return address.matches(".*\\d.*") && address.matches(".*[a-zA-Z].*") && address.length() >= 10;
    }

    // Order completeness check
    public static boolean isOrderComplete(String orderNumber, Long buyerId, List<?> orderItems,
                                          String paymentMethod, String shippingAddress) {
        return !isNullOrEmpty(orderNumber) &&
                isValidId(buyerId) &&
                hasValidOrderItems(orderItems) &&
                isValidPaymentMethod(paymentMethod) &&
                isValidShippingAddress(shippingAddress);
    }

    // Generate order summary for logging/debugging
    public static String generateOrderSummary(String orderNumber, int itemCount, Double totalAmount, String status) {
        return String.format("Order[#%s]: %d items, Total: R%.2f, Status: %s",
                orderNumber, itemCount, totalAmount != null ? totalAmount : 0.0, status);
    }

    // Validate order for creation
    public static void validateOrderForCreation(Long buyerId, List<?> orderItems,
                                                String paymentMethod, String shippingAddress) {
        if (!isValidId(buyerId)) {
            throw new IllegalArgumentException("Invalid buyer ID");
        }
        if (!hasValidOrderItems(orderItems)) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        if (!isValidPaymentMethod(paymentMethod)) {
            throw new IllegalArgumentException("Invalid payment method: " + paymentMethod);
        }
        if (!isValidShippingAddress(shippingAddress)) {
            throw new IllegalArgumentException("Invalid shipping address");
        }
    }
}
