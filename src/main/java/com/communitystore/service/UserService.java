package com.communitystore.service;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.domain.UserType;
import com.communitystore.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service layer responsible for User-related business logic.
 *
 * The UserController handles HTTP requests and responses.
 * The UserRepository handles database communication.
 *
 * This class sits between them and contains the actual business rules
 * for working with CommunityStore users.
 *
 * Flow:
 *
 * Controller
 *      ↓
 * UserService
 *      ↓
 * UserRepository
 *      ↓
 * Database
 */
@Service
public class UserService implements IUserService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    /**
     * Constructor injection.
     *
     * Spring automatically provides the UserRepository and
     * PasswordEncoder when creating this service.
     */
    public UserService(
            UserRepository users,
            PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new CommunityStore user.
     *
     * Registration rules:
     *
     * - Email is required.
     * - Password is required.
     * - Email must be unique.
     * - Username must be unique.
     * - ADMIN cannot be selected during normal registration.
     * - Vendors require administrator verification.
     * - Non-vendors are active immediately.
     * - Passwords are encrypted before being saved.
     */
    @Transactional
    public User register(User user) {

        // ---------------------------------------------------------
        // 1. Make sure a user object was supplied
        // ---------------------------------------------------------

        if (user == null) {
            throw new IllegalArgumentException(
                    "User information is required"
            );
        }

        // ---------------------------------------------------------
        // 2. Validate email
        // ---------------------------------------------------------

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Email is required"
            );
        }

        /*
         * Remove accidental spaces.
         *
         * Example:
         *
         * " john@gmail.com "
         *
         * becomes:
         *
         * "john@gmail.com"
         */
        user.setEmail(user.getEmail().trim());

        // ---------------------------------------------------------
        // 3. Validate password
        // ---------------------------------------------------------

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException(
                    "Password is required"
            );
        }

        // ---------------------------------------------------------
        // 4. Check for duplicate email
        // ---------------------------------------------------------

        if (users.existsByEmailIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }

        // ---------------------------------------------------------
        // 5. Generate username if one was not supplied
        // ---------------------------------------------------------

        if (user.getUsername() == null || user.getUsername().isBlank()) {

            /*
             * Example:
             *
             * email:
             * siganeko@gmail.com
             *
             * generated username:
             * siganeko
             */
            String email = user.getEmail();

            int atSymbol = email.indexOf("@");

            if (atSymbol > 0) {
                user.setUsername(
                        email.substring(0, atSymbol)
                );
            } else {
                /*
                 * This should normally be caught by @Email validation,
                 * but we keep a safe fallback here.
                 */
                throw new IllegalArgumentException(
                        "Please provide a valid email address"
                );
            }

        } else {

            // Clean manually supplied usernames.
            user.setUsername(user.getUsername().trim());
        }

        // ---------------------------------------------------------
        // 6. Check for duplicate username
        // ---------------------------------------------------------

        if (users.existsByUsernameIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException(
                    "Username is already registered"
            );
        }

        // ---------------------------------------------------------
        // 7. Protect the ADMIN role
        // ---------------------------------------------------------

        /*
         * A normal registration request must never be allowed to
         * create an administrator account.
         *
         * If no user type is supplied, we default to RESIDENT.
         *
         * If somebody attempts:
         *
         * "userType": "ADMIN"
         *
         * we also default them to RESIDENT.
         */
        if (user.getUserType() == null ||
                user.getUserType() == UserType.ADMIN) {

            user.setUserType(UserType.RESIDENT);
        }

        // ---------------------------------------------------------
        // 8. Configure account verification and status
        // ---------------------------------------------------------

        if (user.getUserType() == UserType.VENDOR) {

            /*
             * Vendors must be verified by an administrator before
             * they can use the platform as active sellers.
             */
            user.setVerified(false);
            user.setAccountStatus(
                    UserStatus.PENDING_VERIFICATION
            );

        } else {

            /*
             * Students, faculty and residents do not go through
             * vendor verification.
             *
             * Later we can introduce university email verification
             * for students/faculty if required.
             */
            user.setVerified(true);
            user.setAccountStatus(
                    UserStatus.ACTIVE
            );
        }

        // ---------------------------------------------------------
        // 9. Encrypt the password
        // ---------------------------------------------------------

        /*
         * NEVER store a plain-text password in the database.
         *
         * Example:
         *
         * User enters:
         *     Password123
         *
         * Database stores:
         *     BCrypt hash
         *
         * During login, PasswordEncoder.matches() will compare
         * the entered password against the stored hash.
         */
        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        // ---------------------------------------------------------
        // 10. Save the user
        // ---------------------------------------------------------

        return users.save(user);
    }

    /**
     * Finds a user by email address.
     *
     * The repository returns Optional<User>.
     *
     * We convert that Optional to null here because the current
     * controller is designed around a User return value.
     *
     * The controller will safely handle null during login.
     */
    @Transactional(readOnly = true)
    public User findByEmail(String email) {

        if (email == null || email.isBlank()) {
            return null;
        }

        return users.findByEmailIgnoreCase(
                email.trim()
        ).orElse(null);
    }

    /**
     * Finds a user by username.
     */
    @Transactional(readOnly = true)
    public User findByUsername(String username) {

        if (username == null || username.isBlank()) {
            return null;
        }

        return users.findByUsernameIgnoreCase(
                username.trim()
        ).orElse(null);
    }

    /**
     * Finds a user using their database ID.
     */
    @Transactional(readOnly = true)
    public User findById(Long id) {

        if (id == null) {
            return null;
        }

        return users.findById(id).orElse(null);
    }

    /**
     * Returns all users.
     *
     * This endpoint will eventually be restricted to administrators.
     */
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return users.findAll();
    }

    /**
     * Verifies a vendor account.
     *
     * Only users with UserType.VENDOR can be verified through
     * this method.
     */
    @Transactional
    public User verifyVendor(Long id) {

        User user = users.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        // Make sure the selected account is actually a vendor.
        if (user.getUserType() != UserType.VENDOR) {

            throw new IllegalArgumentException(
                    "Only vendors require verification"
            );
        }

        /*
         * Administrator has approved the vendor.
         */
        user.setVerified(true);
        user.setAccountStatus(UserStatus.ACTIVE);

        return users.save(user);
    }

    /**
     * Updates the status of a user account.
     *
     * Possible statuses include:
     *
     * ACTIVE
     * SUSPENDED
     * PENDING_VERIFICATION
     * DEACTIVATED
     */
    @Transactional
    public User updateStatus(
            Long id,
            UserStatus status
    ) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        if (status == null) {
            throw new IllegalArgumentException(
                    "Account status is required"
            );
        }

        User user = users.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"
                        )
                );

        user.setAccountStatus(status);

        return users.save(user);
    }
}