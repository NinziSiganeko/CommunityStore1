package com.communitystore.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS for the React dev server.
 *
 * Origins are configurable so the same build works locally
 * (Vite on 5173/5174) and inside a hosted dev environment:
 *
 *   APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,https://my-app.example.com
 *
 * The default list deliberately keeps the wildcard inside the
 * sandbox domain only. Tightening this further is part of the
 * security-hardening phase.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,https://*.e2b.app}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
