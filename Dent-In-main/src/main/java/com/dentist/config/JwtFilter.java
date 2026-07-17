package com.dentist.config;

import com.dentist.util.JwtUtil;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.validateToken(token)) {
                Long patientId = jwtUtil.extractPatientId(token);
                String email = jwtUtil.extractEmail(token);
                String role = jwtUtil.extractRole(token);

                request.setAttribute("patientId", patientId);
                request.setAttribute("patientEmail", email);
                request.setAttribute("patientRole", role);

                // Set Spring Security authentication with role authority
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + (role != null ? role : "PATIENT")));
                var auth = new UsernamePasswordAuthenticationToken(patientId, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
