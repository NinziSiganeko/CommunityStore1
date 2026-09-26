package com.communitystore.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /*
     * The frontend origin is read from application.properties.
     *
     * Local development:
     * http://localhost:5173
     */
    @Value("${app.cors.allowed-origin:http://localhost:5173}")
    private String allowedOrigin;

    /**
     * Global CORS configuration.
     *
     * We keep CORS here instead of adding separate @CrossOrigin
     * annotations to individual controllers.
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        /*
         * Allow the configured React/Vite frontend.
         */
        configuration.setAllowedOrigins(List.of(allowedOrigin));

        /*
         * HTTP methods used by Community Store.
         */
        configuration.setAllowedMethods(List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
        ));

        /*
         * Headers required by Axios and JWT authentication.
         */
        configuration.setAllowedHeaders(List.of(
                "Authorization",
                "Content-Type"
        ));

        /*
         * Register the configuration for every endpoint.
         */
        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                configuration
        );

        return source;
    }

    /**
     * Main Spring Security configuration.
     */
    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtFilter
    ) throws Exception {

        return http

                /*
                 * JWT authentication is being used instead of
                 * session-based authentication.
                 */
                .csrf(csrf -> csrf.disable())

                /*
                 * Use the global CORS configuration above.
                 */
                .cors(Customizer.withDefaults())

                /*
                 * No server-side login sessions.
                 */
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        /*
                         * Registration and login must work without
                         * an existing JWT.
                         */
                        .requestMatchers(
                                "/users/register",
                                "/users/signin",
                                "/actuator/health"
                        ).permitAll()

                        /*
                         * Browser CORS preflight requests.
                         */
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        ).permitAll()

                        /*
                         * Anyone may browse products and categories.
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/products/**",
                                "/categories/**"
                        ).permitAll()

                        /*
                         * Administrative user-management operations.
                         */
                        .requestMatchers(
                                "/users/*/verify-vendor",
                                "/users/*/status",
                                "/users"
                        ).hasRole("ADMIN")

                        /*
                         * Authenticated community members may create
                         * marketplace listings.
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
                         * Everything else requires authentication.
                         */
                        .anyRequest().authenticated()
                )

                /*
                 * JWT must run before Spring's normal username/password
                 * authentication filter.
                 */
                .addFilterBefore(
                        jwtFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                .build();
    }
}