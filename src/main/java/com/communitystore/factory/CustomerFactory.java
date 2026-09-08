package com.communitystore.factory;

import com.communitystore.domain.Customer;
import com.communitystore.util.Helper;

public class CustomerFactory {

    public static Customer createCustomer(String username, String name, String password, String email, String address, String phoneNumber) {
        if (Helper.isNullOrEmpty(username) ||
                Helper.isNullOrEmpty(password) ||
                Helper.isNullOrEmpty(name) ||
                Helper.isValidEmail(email) ||
                Helper.isNullOrEmpty(address) ||
                Helper.isNullOrEmpty(phoneNumber)) {
            return null;
        }

        return new Customer.Builder()
                .setUsername(username)
                .setFirstName(name)
                .setPassword(password)
                .setEmail(email)
                .setAddress(address)
                .setPhoneNumber(phoneNumber)
                .build();
    }
}