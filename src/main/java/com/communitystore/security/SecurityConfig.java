package com.communitystore.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    /**
     * BCrypt password encoder.
     *
     * This is used when registering users so that passwords
     * are not stored as plain text in the database.
     */
    @Bean
    public org.springframework.security.crypto.password.PasswordEncoder passwordEncoder() {
        return new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
    }

    /**
     * Main Spring Security configuration.
     *
     * This follows the same basic approach used in AnimeStore:
     * - CSRF disabled for our REST API
     * - CORS enabled
     * - Stateless JWT authentication
     * - Public registration/login
     * - Public marketplace browsing
     * - JWT required for protected functionality
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                /*
                 * CommunityStore is using JWT rather than
                 * browser sessions, so CSRF is disabled for now.
                 */
                .csrf(csrf -> csrf.disable())

                /*
                 * Use our CORS configuration below.
                 */
                .cors(cors ->
                        cors.configurationSource(corsConfigurationSource())
                )

                /*
                 * No server-side sessions.
                 * Authentication is handled using JWT.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Registration and login must be available
                         * before a user has a JWT.
                         */
                        .requestMatchers(
                                "/users/register",
                                "/users/signin"
                        ).permitAll()

                        /*
                         * Allow browser CORS preflight requests.
                         */
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        /*
                         * Marketplace browsing is public.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/products/**",
                                "/categories/**"
                        ).permitAll()

                        /*
                         * Creating marketplace listings requires
                         * a logged-in CommunityStore user.
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/products/**"
                        ).hasAnyRole(
                                "ADMIN",
                                "STUDENT",
                                "FACULTY",
                                "VENDOR",
                                "RESIDENT"
                        )

                        /*
                         * User administration remains restricted
                         * to administrators.
                         */
                        .requestMatchers(
                                "/users/*/verify-vendor",
                                "/users/*/status",
                                "/users"
                        ).hasRole("ADMIN")

                        /*
                         * Everything else requires authentication.
                         */
                        .anyRequest().authenticated()
                )

                /*
                 * Process JWT before Spring's normal username/password
                 * authentication filter.
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * CORS configuration.
     *
     * This follows the same simple approach used by AnimeStore.
     *
     * CommunityStore is currently running on port 5174,
     * so both 5173 and 5174 are allowed during development.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        /*
         * Allow both common Vite development ports.
         *
         * 5173 = normal Vite port
         * 5174 = the port CommunityStore is currently using
         */
        configuration.setAllowedOrigins(
                Arrays.asList(
                        "http://localhost:5173",
                        "http://localhost:5174"
                )
        );

        /*
         * Same methods used by AnimeStore.
         */
        configuration.setAllowedMethods(
                Arrays.asList(
                        "GET",
                        "POST",
                        "PUT",
                        "DELETE",
                        "OPTIONS"
                )
        );

        /*
         * AnimeStore allows all request headers.
         *
         * This is useful for CommunityStore because Axios
         * will eventually send:
         *
         * Authorization: Bearer <JWT>
         */
        configuration.setAllowedHeaders(
                Arrays.asList("*")
        );

        /*
         * Allow credentials for frontend/backend communication.
         */
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }
}