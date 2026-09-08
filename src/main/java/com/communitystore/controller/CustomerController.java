package com.communitystore.controller;

import com.communitystore.domain.Customer;
import com.communitystore.security.JwtUtils;
import com.communitystore.service.CustomerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/customer")
@CrossOrigin(origins = "http://localhost:5173")
public class CustomerController {

    @Autowired
    private CustomerService customerService;

    @Autowired
    private JwtUtils jwtTokenUtils;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/create")
    public Customer create(@RequestBody Customer customer) {
        try {
            return customerService.create(customer);
        } catch (Exception e) {
            System.out.println("Error creating customer: " + e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @GetMapping("/read/{userId}")
    public Customer read(@PathVariable Long userId) {
        return customerService.read(userId);
    }

    @PostMapping("/update")
    public Customer update(@RequestBody Customer customer) {
        return customerService.update(customer);
    }

    @DeleteMapping("/delete/{userId}")
    public void delete(@PathVariable Long userId) {
        customerService.delete(userId);
    }

    @GetMapping("/getAll")
    public List<Customer> getAll() {
        return customerService.getAll();
    }

    @PostMapping("/signin")
    public Map<String, Object> signIn(@RequestBody Map<String, String> credentials) {
        String email = credentials.get("email").trim();
        String password = credentials.get("password").trim();

        Customer customer = customerService.findByEmail(email);

        // Use the password encoder to securely compare the plain-text password
        // with the hashed password from the database.
        if (customer != null && passwordEncoder.matches(password, customer.getPassword())) {
            String token = jwtTokenUtils.generateToken(customer.getEmail(),"CUSTOMER");

            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("userId", customer.getUserId());
            response.put("email", customer.getEmail());
            response.put("firstName", customer.getFirstName());
            response.put("lastName", customer.getLastName());
            response.put("role", "CUSTOMER");

            return response;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
    }
}