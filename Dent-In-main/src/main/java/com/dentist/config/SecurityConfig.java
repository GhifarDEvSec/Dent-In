package com.dentist.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/api/otp/**",
                    "/",
                    "/index.html",
                    "/styles.css",
                    "/app.js",
                    "/h2-console/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/api/maps/**"
                ).permitAll()
                // Dentist endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/dentists/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/dentists/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/dentists/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/dentists/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/dentists/**").hasRole("ADMIN")
                // Scan endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/scans/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/scans/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/scans/**").hasRole("ADMIN")
                // Prescription endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/prescriptions/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/prescriptions/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/prescriptions/**").hasRole("ADMIN")
                // Appointment endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/appointments/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/appointments/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.PATCH, "/api/appointments/**").hasRole("ADMIN")
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/appointments/**").hasRole("ADMIN")
                // Patient endpoints
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/patients/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/patients/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/patients/**").hasRole("ADMIN")
                // Notifications
                .requestMatchers("/api/notifications/**").permitAll()
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
