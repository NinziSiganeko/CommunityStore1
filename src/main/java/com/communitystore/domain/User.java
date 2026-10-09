package com.communitystore.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    /**
     * Password is write-only for JSON.
     *
     * This means:
     * - Frontend CAN send the password when registering.
     * - Backend CAN read it using getPassword().
     * - Backend will NOT return the password in JSON responses.
     */
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @NotBlank(message = "Password is required")
    @Size(
            min = 8,
            max = 100,
            message = "Password must contain between 8 and 100 characters"
    )
    @Column(
            nullable = false,
            length = 100
    )
    private String password;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Column(
            nullable = false,
            unique = true,
            length = 150
    )
    private String email;

    @Size(
            max = 50,
            message = "First name cannot exceed 50 characters"
    )
    @Column(length = 50)
    private String firstName;

    @Size(
            max = 50,
            message = "Last name cannot exceed 50 characters"
    )
    @Column(length = 50)
    private String lastName;

    @Size(
            max = 20,
            message = "Phone number cannot exceed 20 characters"
    )
    @Column(length = 20)
    private String phoneNumber;

    @Size(
            max = 255,
            message = "Address cannot exceed 255 characters"
    )
    @Column(length = 255)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 20
    )
    private UserType userType = UserType.RESIDENT;

    @Column(nullable = false)
    private boolean verified = false;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private UserStatus accountStatus = UserStatus.ACTIVE;

    /**
     * JPA requires a protected no-argument constructor.
     */
    protected User() {
    }

    /**
     * Constructor without username.
     *
     * Username has been removed because email is now
     * the user's unique login identifier.
     */
    public User(
            Long userId,
            String password,
            String email
    ) {
        this.userId = userId;
        this.password = password;
        this.email = email;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public UserType getUserType() {
        return userType;
    }

    public void setUserType(UserType userType) {
        this.userType = userType;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public UserStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(UserStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    @Override
    public String toString() {
        return "User{" +
                "userId=" + userId +
                ", email='" + email + '\'' +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", userType=" + userType +
                ", verified=" + verified +
                ", accountStatus=" + accountStatus +
                '}';
    }
}

