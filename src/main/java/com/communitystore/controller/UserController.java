package com.communitystore.controller;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
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
public class UserController {

    private final UserService users;
    private final PasswordEncoder passwords;

    public UserController(
            UserService users,
            PasswordEncoder passwords
    ) {
        this.users = users;
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
     * Checks the password and returns basic profile information for the
     * frontend. Requests are not authenticated after this response.
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

        /*
         * Vendor accounts start in PENDING_VERIFICATION so that an
         * admin can review them. They may sign in (to see their
         * verification status and browse) but cannot publish
         * listings until they are verified.
         *
         * Suspended and deactivated accounts are still blocked.
         */
        if (user.getAccountStatus() != UserStatus.ACTIVE
                && user.getAccountStatus() != UserStatus.PENDING_VERIFICATION) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Account is not active"
            );
        }

        Map<String, Object> response = new HashMap<>();
        response.put("userId", user.getUserId());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("phoneNumber", user.getPhoneNumber());
        response.put("address", user.getAddress());
        response.put("role", user.getUserType().name());
        response.put("verified", user.isVerified());
        response.put("accountStatus", user.getAccountStatus().name());

        return response;

    }

    @GetMapping
    public List<User> getAll() {
        return users.findAll();
    }

    /**
     * Returns a single user, used by the profile and checkout
     * screens to refresh the stored session details.
     */
    @GetMapping("/{id}")
    public User getOne(@PathVariable Long id) {
        User user = users.findById(id);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return user;
    }

    /**
     * Vendor accounts that are still waiting for admin review.
     *
     * The admin dashboard reads this list to show the
     * verification queue.
     */
    @GetMapping("/vendors/pending")
    public List<User> getPendingVendors() {
        return users.findPendingVendors();
    }

    /**
     * Updates the editable parts of a profile:
     * first name, last name, phone number and address.
     *
     * Email, password, role, verification flag and account
     * status deliberately cannot be changed from here.
     */
    @PutMapping("/{id}/profile")
    public User updateProfile(
            @PathVariable Long id,
            @RequestBody User profile
    ) {
        try {
            return users.updateProfile(id, profile);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
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
