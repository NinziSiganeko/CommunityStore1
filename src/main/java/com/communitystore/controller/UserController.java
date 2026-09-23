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
 *
 * Endpoints currently provided:
 *
 * POST /users/register
 * POST /users/signin
 * GET  /users
 * PUT  /users/{id}/verify-vendor
 * PUT  /users/{id}/status
 *
 * The controller is responsible for:
 *
 * - Receiving HTTP requests
 * - Calling the service layer
 * - Returning HTTP responses
 *
 * Business rules remain inside UserService.
 */
@RestController
@RequestMapping("/users")
@CrossOrigin(
        origins = "${app.cors.allowed-origin:http://localhost:5173}"
)
public class UserController {

    private final UserService users;
    private final JwtUtils jwt;
    private final PasswordEncoder passwords;

    /**
     * Constructor injection.
     */
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
     * Registers a new user.
     *
     * Endpoint:
     *
     * POST /users/register
     *
     * The request body contains the new user's information.
     */
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User register(@RequestBody User user) {

        try {

            return users.register(user);

        } catch (IllegalArgumentException e) {

            /*
             * Business validation failures are returned as HTTP 400.
             */
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );
        }
    }

    /**
     * Authenticates a user and generates a JWT token.
     *
     * Endpoint:
     *
     * POST /users/signin
     *
     * Expected JSON:
     *
     * {
     *     "email": "user@example.com",
     *     "password": "Password123"
     * }
     */
    @PostMapping("/signin")
    public Map<String, Object> signIn(
            @RequestBody Map<String, String> credentials
    ) {

        // ---------------------------------------------------------
        // 1. Extract email and password
        // ---------------------------------------------------------

        String email = credentials.getOrDefault(
                "email",
                ""
        ).trim();

        String password = credentials.getOrDefault(
                "password",
                ""
        );

        // ---------------------------------------------------------
        // 2. Validate that credentials were supplied
        // ---------------------------------------------------------

        if (email.isBlank() || password.isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email and password are required"
            );
        }

        // ---------------------------------------------------------
        // 3. Find the user
        // ---------------------------------------------------------

        User user = users.findByEmail(email);

        // ---------------------------------------------------------
        // 4. Check credentials
        // ---------------------------------------------------------

        /*
         * We deliberately use PasswordEncoder.matches().
         *
         * We NEVER decrypt the BCrypt password.
         *
         * Instead:
         *
         * entered password
         *        ↓
         * PasswordEncoder.matches()
         *        ↓
         * stored BCrypt hash
         */
        if (user == null ||
                !passwords.matches(
                        password,
                        user.getPassword()
                )) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid email or password"
            );
        }

        // ---------------------------------------------------------
        // 5. Check account status
        // ---------------------------------------------------------

        if (user.getAccountStatus() != UserStatus.ACTIVE) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Account is not active"
            );
        }

        // ---------------------------------------------------------
        // 6. Generate JWT
        // ---------------------------------------------------------

        String token = jwt.generateToken(
                user.getEmail(),
                user.getUserType().name()
        );

        // ---------------------------------------------------------
        // 7. Build login response
        // ---------------------------------------------------------

        Map<String, Object> response = new HashMap<>();

        response.put("token", token);
        response.put("userId", user.getUserId());
        response.put("email", user.getEmail());
        response.put("role", user.getUserType().name());

        return response;
    }

    /**
     * Returns all users.
     *
     * NOTE:
     *
     * SecurityConfig already controls access to this endpoint.
     * We will review and strengthen that security configuration
     * after the authentication foundation is complete.
     */
    @GetMapping
    public List<User> getAll() {
        return users.findAll();
    }

    /**
     * Verifies a vendor.
     *
     * Endpoint:
     *
     * PUT /users/{id}/verify-vendor
     */
    @PutMapping("/{id}/verify-vendor")
    public User verifyVendor(
            @PathVariable Long id
    ) {

        try {

            return users.verifyVendor(id);

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );
        }
    }

    /**
     * Updates a user's account status.
     *
     * Example:
     *
     * PUT /users/5/status?status=SUSPENDED
     */
    @PutMapping("/{id}/status")
    public User updateStatus(
            @PathVariable Long id,
            @RequestParam UserStatus status
    ) {

        try {

            return users.updateStatus(
                    id,
                    status
            );

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    e.getMessage()
            );
        }
    }
}