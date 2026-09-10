package com.communitystore.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long userId;

    @Column(nullable = false, unique = true) protected String username;
    @JsonIgnore @Column(nullable = false) protected String password;
    @Column(nullable = false, unique = true) protected String email;
    protected String firstName;
    protected String lastName;
    protected String phoneNumber;
    protected String address;
    @Enumerated(EnumType.STRING) @Column(nullable = false) protected UserType userType = UserType.RESIDENT;
    @Column(nullable = false) protected boolean verified = false;
    @Enumerated(EnumType.STRING) @Column(nullable = false) protected UserStatus accountStatus = UserStatus.ACTIVE;

    protected User() {
    }

    public User(Long userId, String username, String password, String email) {
        this.userId = userId;
        this.username = username;
        this.password = password;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getEmail() {
        return email;
    }

    public String getFirstName() { return firstName; }
    public String getLastName() { return lastName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getAddress() { return address; }
    public UserType getUserType() { return userType; }
    public boolean isVerified() { return verified; }
    public UserStatus getAccountStatus() { return accountStatus; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setUsername(String username) { this.username = username; }
    public void setPassword(String password) { this.password = password; }
    public void setEmail(String email) { this.email = email; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public void setAddress(String address) { this.address = address; }
    public void setUserType(UserType userType) { this.userType = userType; }
    public void setVerified(boolean verified) { this.verified = verified; }
    public void setAccountStatus(UserStatus accountStatus) { this.accountStatus = accountStatus; }


}
