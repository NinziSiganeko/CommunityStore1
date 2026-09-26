package com.communitystore.controller;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.security.JwtUtils;
import com.communitystore.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller responsible for user-related HTTP requests.
 */
@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
public class UserController {

    private final UserService users;
    private final JwtUtils jwt;
    private final PasswordEncoder passwords;

    public UserController(
            UserService users,
            JwtUtils jwt,
            PasswordEncoder passwords
    ) {
        this.users = users;
        this.jwt = jwt;
        this.passwords = passwords;
    }

    /**
     * Registers a new Community Store user.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User register(@RequestBody User user) {
        try {
            return users.register(user);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Authenticates a user and returns the JWT plus the basic user profile
     * information needed by the frontend header and dashboard links.
     */
    @PostMapping("/signin")
    public Map<String, Object> signIn(@RequestBody Map<String, String> credentials) {
        String email = credentials.getOrDefault("email", "").trim();
        String password = credentials.getOrDefault("password", "");

        if (email.isBlank() || password.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email and password are required"
            );
        }

        User user = users.findByEmail(email);

        if (user == null || !passwords.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        if (user.getAccountStatus() != UserStatus.ACTIVE) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Account is not active"
            );
        }

        String token = jwt.generateToken(
                user.getEmail(),
                user.getUserType().name()
        );

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getUserId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("role", user.getUserType().name());
        response.put("verified", user.isVerified());

        return response;
    }

    @GetMapping
    public List<User> getAll() {
        return users.findAll();
    }

    @PutMapping("/{id}/verify-vendor")
    public User verifyVendor(@PathVariable Long id) {
        try {
            return users.verifyVendor(id);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public User updateStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status
    ) {
        try {
            return users.updateStatus(id, status);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
