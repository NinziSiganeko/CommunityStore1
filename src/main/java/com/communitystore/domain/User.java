package com.communitystore.domain;

import jakarta.persistence.*;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "user_type", discriminatorType = DiscriminatorType.STRING)
@DiscriminatorValue("User")

public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    protected Long userId;

    protected String username;
    protected String password;
    protected String email;

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


}