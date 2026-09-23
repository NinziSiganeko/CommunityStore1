package com.communitystore.service;
import com.communitystore.domain.*;
import com.communitystore.repository.UserRepository;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
@Service
public class UserService implements IUserService{

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }
    @Transactional
    public User register(User user) {

        if (user.getEmail() == null || user.getEmail().isBlank() || user.getPassword() == null || user.getPassword().isBlank()) throw new IllegalArgumentException("Email and password are required");
        if (users.existsByEmailIgnoreCase(user.getEmail())) throw new IllegalArgumentException("Email is already registered");
        if (user.getUsername() == null || user.getUsername().isBlank()) user.setUsername(user.getEmail());
        if (users.existsByUsernameIgnoreCase(user.getUsername())) throw new IllegalArgumentException("Username is already registered");
        if (user.getUserType() == null || user.getUserType() == UserType.ADMIN) user.setUserType(UserType.RESIDENT);
        user.setVerified(user.getUserType() != UserType.VENDOR); user.setAccountStatus(user.getUserType() == UserType.VENDOR ? UserStatus.PENDING_VERIFICATION : UserStatus.ACTIVE); user.setPassword(passwordEncoder.encode(user.getPassword()));
        return users.save(user);
    }
    @Transactional(readOnly = true)
    public User findByEmail(String email) {
        return users.findByEmailIgnoreCase(email).orElse(null);
    }
    @Transactional(readOnly = true)
    public List<User> findAll() {
        return users.findAll();
    }
    @Transactional
    public User verifyVendor(Long id) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getUserType() != UserType.VENDOR) throw new IllegalArgumentException("Only vendors require verification");
        user.setVerified(true); user.setAccountStatus(UserStatus.ACTIVE); return users.save(user);
    }
    @Transactional
    public User updateStatus(Long id, UserStatus status) {
        User user = users.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setAccountStatus(status); return users.save(user);
    }
}
