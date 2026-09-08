package com.communitystore.service;

import com.communitystore.domain.Customer;
import com.communitystore.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
public class CustomerService implements ICustomerService {

    private final CustomerRepository repository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public CustomerService(CustomerRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Customer create(Customer customer) {
        // 1. Hash the plain-text password
        String hashedPassword = passwordEncoder.encode(customer.getPassword());

        // 2. Use the existing copy() method and setPassword() to create a new Customer
        //    with the hashed password
        Customer customerWithHashedPassword = new Customer.Builder()
                .copy(customer)  // Copy all existing fields
                .setPassword(hashedPassword)  // Override with hashed password
                .build();

        // 3. Save and return the customer with the hashed password
        return this.repository.save(customerWithHashedPassword);
    }

    @Override
    public Customer read(Long id) {
        return this.repository.findById(id).orElse(null);
    }

    @Override
    public Customer update(Customer customer) {
        // If you allow password updates, you should hash the password here too.
        // For now, we assume password updates are handled separately.
        return this.repository.save(customer);
    }

    @Override
    public boolean delete(Long id) {
        this.repository.deleteById(id);
        return true;
    }

    @Override
    public List<Customer> getAll() {
        return this.repository.findAll();
    }

    public Customer findByEmail(String email) {
        return repository.findByEmailIgnoreCase(email.trim()).orElse(null);
    }
}
