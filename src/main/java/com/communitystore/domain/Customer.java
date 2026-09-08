package com.communitystore.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

@Entity
@DiscriminatorValue("Customer")
public class Customer extends User {

    private String address;
    private String phoneNumber;
    private String firstName;
    private String lastName;

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CustomerOrder> orders = new ArrayList<>();

    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Payment> payments = new ArrayList<>();


    protected Customer() {}

    private Customer(Builder builder) {
        this.userId = builder.userId;
        this.username = builder.username;
        this.password = builder.password;
        this.email = builder.email;
        this.address = builder.address;
        this.phoneNumber = builder.phoneNumber;
        this.firstName = builder.firstName;
        this.lastName = builder.lastName;

    }
    public String getAddress() { return address; }
    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }


    @Override
    public String toString() {
        return "Customer{" +
                "address='" + address + '\'' +
                ", phoneNumber='" + phoneNumber + '\'' +
                ", userId=" + userId +
                ", username='" + username + '\'' +
                ", password='" + password + '\'' +
                ", email='" + email + '\'' +
                '}';
    }

    public static class Builder {
        private Long userId;
        private String username;
        private String password;
        private String email;
        private String address;
        private String phoneNumber;
        private String firstName;
        private String lastName;

        public Builder setUserId(Long userId) { this.userId = userId; return this; }
        public Builder setUsername(String username) { this.username = username; return this; }
        public Builder setPassword(String password) { this.password = password; return this; }
        public Builder setEmail(String email) { this.email = email; return this; }
        public Builder setAddress(String address) { this.address = address; return this; }
        public Builder setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; return this; }
        public Builder setFirstName(String firstName) { this.firstName = firstName; return this; }
        public Builder setLastName(String lastName) { this.lastName = lastName; return this; }

        public Builder copy(Customer customer) {
            this.userId = customer.userId;
            this.username = customer.username;
            this.password = customer.password;
            this.email = customer.email;
            this.address = customer.address;
            this.phoneNumber = customer.phoneNumber;
            this.firstName = customer.firstName;
            this.lastName = customer.lastName;
            return this;
        }

        public Customer build() {
            return new Customer(this);
        }
    }

}
