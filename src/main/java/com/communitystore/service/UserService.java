package com.communitystore.service;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.domain.UserType;
import com.communitystore.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Pattern;


@Service
public class UserService implements IUserService {

    /**
     * Lenient contact-number check: digits, spaces and the usual
     * punctuation, without forcing a single country format.
     */
    private static final Pattern PHONE_PATTERN =
            Pattern.compile("^[0-9+()\\-\\s]{7,20}$");

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;



    public UserService(
            UserRepository users,
            PasswordEncoder passwordEncoder
    ) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }


    @Transactional
    public User register(User user) {


        if (user == null) {
            throw new IllegalArgumentException(
                    "User information is required"
            );
        }

        if (user.getEmail() == null || user.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                    "Email is required"
            );
        }


        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException(
                    "Password is required"
            );
        }

        if (users.existsByEmailIgnoreCase(user.getEmail())) {
            throw new IllegalArgumentException(
                    "Email is already registered"
            );
        }




        if (user.getUserType() == null ||
                user.getUserType() == UserType.ADMIN) {

            user.setUserType(UserType.RESIDENT);
        }


        if (user.getUserType() == UserType.VENDOR) {


            user.setVerified(false);
            user.setAccountStatus(
                    UserStatus.PENDING_VERIFICATION
            );

        } else {

            user.setVerified(true);
            user.setAccountStatus(
                    UserStatus.ACTIVE
            );
        }


        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );
        return users.save(user);
    }


    @Transactional(readOnly = true)
    public User findByEmail(String email) {

        if (email == null || email.isBlank()) {
            return null;
        }

        return users.findByEmailIgnoreCase(
                email.trim()
        ).orElse(null);
    }




    @Transactional(readOnly = true)
    public User findById(Long id) {

        if (id == null) {
            return null;
        }

        return users.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public List<User> findAll() {
        return users.findAll();
    }

    /**
     * Vendors that registered but have not been verified yet.
     *
     * The admin dashboard uses this as its verification queue.
     */
    @Transactional(readOnly = true)
    public List<User> findPendingVendors() {

        return users.findAll()
                .stream()
                .filter(user ->
                        user.getUserType() == UserType.VENDOR
                                && (user.getAccountStatus()
                                == UserStatus.PENDING_VERIFICATION
                                || !user.isVerified())
                )
                .toList();
    }

    /**
     * Updates the contact details a user is allowed to edit
     * themselves.
     *
     * Email, password, role, verification and account status are
     * intentionally ignored so a profile update can never grant
     * extra permissions.
     */
    @Transactional
    public User updateProfile(Long id, User profile) {

        if (id == null) {
            throw new IllegalArgumentException(
                    "User ID is required"
            );
        }

        if (profile == null) {
            throw new IllegalArgumentException(
                    "Profile details are required"
            );
        }

        User user = users.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User not found"
                ));

        if (profile.getFirstName() != null) {
            user.setFirstName(normalize(profile.getFirstName(), 50));
        }

        if (profile.getLastName() != null) {
            user.setLastName(normalize(profile.getLastName(), 50));
        }

        if (profile.getPhoneNumber() != null) {

            String phone = normalize(profile.getPhoneNumber(), 20);

            if (!phone.isEmpty()
                    && !PHONE_PATTERN.matcher(phone).matches()) {

                throw new IllegalArgumentException(
                        "Phone number looks invalid"
                );
            }

            user.setPhoneNumber(phone);
        }

        if (profile.getAddress() != null) {
            user.setAddress(normalize(profile.getAddress(), 255));
        }

        return users.save(user);
    }

    private static String normalize(String value, int maxLength) {

        String trimmed = value == null ? "" : value.trim();

        if (trimmed.length() > maxLength) {
            throw new IllegalArgumentException(
                    "Value cannot exceed " + maxLength + " characters"
            );
        }

        return trimmed;
    }
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
        user.setVerified(true);
        user.setAccountStatus(UserStatus.ACTIVE);

        return users.save(user);
    }

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