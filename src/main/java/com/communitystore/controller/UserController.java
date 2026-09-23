package com.communitystore.controller;
import com.communitystore.domain.*;
import com.communitystore.security.JwtUtils;
import com.communitystore.service.UserService;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
@RestController @RequestMapping("/users")
@CrossOrigin(origins = "${app.cors.allowed-origin:http://localhost:5173}")
public class UserController {

    private final UserService users;
    private final JwtUtils jwt;
    private final PasswordEncoder passwords;

    public UserController(UserService users, JwtUtils jwt, PasswordEncoder passwords) {
        this.users = users;
        this.jwt = jwt;
        this.passwords = passwords;
    }
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public User register(@RequestBody User user) {
        try {
            return users.register(user);
        } catch (IllegalArgumentException e)
        {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
    @PostMapping("/signin")
    public Map<String, Object> signIn(@RequestBody Map<String, String> credentials) {
        String email = credentials.getOrDefault("email", "").trim();
        User user = users.findByEmail(email);
        if (user == null || !passwords.matches(credentials.getOrDefault("password", ""), user.getPassword()) || user.getAccountStatus() != UserStatus.ACTIVE)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials or inactive account");
        return Map.of("token", jwt.generateToken(user.getEmail(), user.getUserType().name()), "userId", user.getUserId(), "email", user.getEmail(), "role", user.getUserType().name()); }
    @GetMapping
    public List<User> getAll() {
        return users.findAll();
    }
    @PutMapping("/{id}/verify-vendor")
    public User verifyVendor(@PathVariable Long id) {
        return users.verifyVendor(id);
    }
    @PutMapping("/{id}/status")
    public User updateStatus(@PathVariable Long id, @RequestParam UserStatus status) {
        return users.updateStatus(id, status);
    }
}
