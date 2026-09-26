package com.communitystore.service;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.domain.UserType;
import com.communitystore.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
public class UserService implements IUserService {

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