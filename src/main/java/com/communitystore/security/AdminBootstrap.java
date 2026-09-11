package com.communitystore.security;

import com.communitystore.domain.User;
import com.communitystore.domain.UserStatus;
import com.communitystore.domain.UserType;
import com.communitystore.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrap {
    @Bean
    CommandLineRunner createConfiguredAdmin(UserRepository users, PasswordEncoder passwords,
            @Value("${ADMIN_EMAIL:}") String email,
            @Value("${ADMIN_PASSWORD:}") String password) {
        return args -> {
            if (email.isBlank() || password.isBlank() || users.existsByEmailIgnoreCase(email)) return;
            User admin = new User(null, email, passwords.encode(password), email);
            admin.setUserType(UserType.ADMIN);
            admin.setVerified(true);
            admin.setAccountStatus(UserStatus.ACTIVE);
            users.save(admin);
        };
    }
}
