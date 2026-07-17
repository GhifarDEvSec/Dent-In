# Dent-in Unified — Deployment Guide

> How to connect free 3rd-party tools and deploy your Spring Boot dental clinic app publicly.

---

## Project Overview

| Layer | Tech |
|-------|------|
| Backend | Spring Boot 3.2, Java 21, Maven |
| Database | H2 (dev) → PostgreSQL (prod) |
| Auth | Custom (email/password hash) |
| AI | Simulated (needs real AI service) |
| Frontend | HTML/CSS/JS served from Spring Boot static |

---

## Table of Contents

1. [Database — Supabase PostgreSQL](#1-database--supabase-postgresql)
2. [Deploy Backend — Railway](#2-deploy-backend--railway)
3. [AI Teeth Analysis — Hugging Face](#3-ai-teeth-analysis--hugging-face)
4. [Analytics — PostHog](#4-analytics--posthog)
5. [Environment Variables](#5-environment-variables)
6. [Fix CORS for Production](#6-fix-cors-for-production)
7. [Add JWT Authentication](#7-add-jwt-authentication)
8. [Free Hosting Alternatives](#8-free-hosting-alternatives)

---

## 1. Database — Supabase PostgreSQL

Your app already has PostgreSQL driver in `pom.xml`. Switch from H2 to Supabase.

### Step 1: Create Supabase Project

1. Go to https://supabase.com → Sign up (free)
2. Click **"New Project"**
3. Set:
   - Project name: `dentin-clinic`
   - Database password: (save this!)
   - Region: closest to your users
4. Wait ~2 minutes for setup

### Step 2: Get Connection URL

1. Go to **Settings → Database**
2. Copy the **Connection string → URI**
3. It looks like:
   ```
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

### Step 3: Update application.properties

```properties
# H2 Database — COMMENT OUT these lines:
# spring.datasource.url=jdbc:h2:mem:dentaldb
# spring.datasource.driverClassName=org.h2.Driver
# spring.datasource.username=sa
# spring.datasource.password=
# spring.h2.console.enabled=true
# spring.h2.console.path=/h2-console

# PostgreSQL (Supabase)
spring.datasource.url=${DATABASE_URL}
spring.datasource.driverClassName=org.postgresql.Driver
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
```

### Step 4: Test Locally

```bash
# Set env var before running
export DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"

# On Windows PowerShell:
$env:DATABASE_URL="postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres"

mvn spring-boot:run
```

---

## 2. Deploy Backend — Railway

### Step 1: Create Railway Account

1. Go to https://railway.app → Sign up with GitHub
2. Free tier = $5/month credit (enough for this app)

### Step 2: Push Code to GitHub

```bash
cd C:\Haackathon\dentin-unified
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/dentin-unified.git
git push -u origin main
```

### Step 3: Deploy on Railway

1. Click **"New Project"** → **"Deploy from GitHub Repo"**
2. Select your `dentin-unified` repo
3. Railway auto-detects it's a Java/Maven project
4. It will run: `mvn clean package -DskipTests && java -jar target/*.jar`

### Step 4: Add Environment Variables

In Railway dashboard → **Variables** tab, add:

```
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SPRING_PROFILES_ACTIVE=production
```

### Step 5: Get Your Public URL

1. Go to **Settings → Networking**
2. Click **"Generate Domain"**
3. You get: `https://dentin-unified-production.up.railway.app`
4. Your API is now live at that URL + `/api/...`

---

## 3. AI Teeth Analysis — Hugging Face

Your `TeethScanService.java` has a `TODO` at line 95:
```java
// TODO: Integrate with actual AI/ML service (TensorFlow, OpenCV, or cloud AI API)
```

### Option A: Hugging Face Inference API (Easiest)

1. Go to https://huggingface.co → Sign up (free)
2. Go to **Settings → Access Tokens** → Create token
3. Find a dental/oral health model:
   - Search: https://huggingface.co/models?search=dental+classification
   - Or use a general image classifier like `google/vit-base-patch16-224`

### Step 2: Add to pom.xml

```xml
<dependency>
    <groupId>com.squareup.okhttp3</groupId>
    <artifactId>okhttp</artifactId>
    <version>4.12.0</version>
</dependency>
```

### Step 3: Update TeethScanService.java

Replace the `performAIAnalysis` method:

```java
import okhttp3.*;
import com.fasterxml.jackson.databind.ObjectMapper;

private static final String HF_API_URL = "https://api-inference.huggingface.co/models/google/vit-base-patch16-224";
private final OkHttpClient httpClient = new OkHttpClient();
private final ObjectMapper objectMapper = new ObjectMapper();

private String performAIAnalysis(String imagePath) {
    try {
        // Read the image file
        byte[] imageBytes = Files.readAllBytes(Paths.get(imagePath));

        RequestBody body = new MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("inputs",
                new RequestBody.create(imageBytes, MediaType.parse("image/jpeg")))
            .build();

        Request request = new Request.Builder()
            .url(HF_API_URL)
            .header("Authorization", "Bearer " + System.getenv("HF_API_TOKEN"))
            .post(body)
            .build();

        try (Response response = httpClient.newCall(request).execute()) {
            return response.body().string();
        }
    } catch (Exception e) {
        return "{\"error\": \"AI analysis failed: " + e.getMessage() + "\"}";
    }
}
```

### Step 4: Add Environment Variable

```
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx
```

### Option B: Hugging Face Spaces (Custom Model)

If you trained your own dental model:

1. Create a Hugging Face Space: https://huggingface.co/new-space
2. Choose **Gradio** or **FastAPI** template
3. Upload your model (`.h5`, `.pt`, or `.onnx`)
4. Deploy → get a public URL like `https://your-username-dental-model.hf.space`
5. Call it from your Spring Boot app via HTTP

---

## 4. Analytics — PostHog

Track patient interactions, page views, and scan usage.

### Step 1: Create PostHog Account

1. Go to https://posthog.com → Sign up (free, 1M events/month)
2. Create a project → copy the **Project API Key**

### Step 2: Add to Frontend (index.html)

Before `</head>` in `src/main/resources/static/index.html`:

```html
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionFeatureFlag".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('YOUR_POSTHOG_API_KEY', {
    api_host: 'https://us.i.posthog.com'
  });
</script>
```

### Step 3: Track Events in app.js

Add tracking calls in your JavaScript:

```javascript
// Track login
posthog.capture('user_logged_in', { method: 'email' });

// Track appointment booked
posthog.capture('appointment_booked', { dentist_id: id });

// Track teeth scan uploaded
posthog.capture('teeth_scan_uploaded', { patient_id: id });

// Track page views (automatic with PostHog)
```

---

## 5. Environment Variables

Create a `.env` file (DO NOT commit to git):

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres

# AI (Hugging Face)
HF_API_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxx

# Analytics (PostHog)
POSTHOG_API_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx

# Spring
SPRING_PROFILES_ACTIVE=production
```

Add to `.gitignore`:
```
.env
uploads/
```

---

## 6. Fix CORS for Production

Your `WebConfig.java` only allows `localhost`. Update for production:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins.split(","))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

Add to `application.properties`:
```properties
# Production CORS
app.cors.allowed-origins=https://your-vercel-app.vercel.app,https://your-railway-app.up.railway.app
```

---

## 7. Add JWT Authentication (Important for Public Use)

Your current auth returns the Patient object with no token. For public use, add JWT:

### Step 1: Add Dependencies to pom.xml

```xml
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.3</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.3</version>
    <scope>runtime</scope>
</dependency>
```

### Step 2: Add JWT Utility Class

Create `src/main/java/com/dentist/util/JwtUtil.java`:

```java
package com.dentist.util;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:defaultSecretKeyThatShouldBeChangedInProduction123456}")
    private String secret;

    @Value("${jwt.expiration:86400000}") // 24 hours
    private long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String generateToken(Long patientId, String email) {
        return Jwts.builder()
            .subject(String.valueOf(patientId))
            .claim("email", email)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(getSigningKey())
            .compact();
    }

    public Long extractPatientId(String token) {
        return Long.parseLong(Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject());
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }
}
```

### Step 3: Update AuthService to Return Token

```java
public String[] login(LoginRequest request) {
    Patient patient = /* ... existing login logic ... */;
    String token = jwtUtil.generateToken(patient.getId(), patient.getEmail());
    return new String[]{token, String.valueOf(patient.getId())};
}
```

### Step 4: Add JWT Filter for Protected Routes

Create `src/main/java/com/dentist/config/JwtFilter.java`:

```java
package com.dentist.config;

import com.dentist.util.JwtUtil;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

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
                request.setAttribute("patientId", patientId);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

---

## 8. Free Hosting Alternatives

| Service | Free Tier | Best For |
|---------|-----------|----------|
| **Railway** | $5/mo credit | Spring Boot backend |
| **Render** | 750 hrs/mo | Spring Boot backend |
| **Fly.io** | 3 shared VMs | Spring Boot backend |
| **Vercel** | Unlimited | Frontend (if separated) |
| **Netlify** | 100GB/mo | Frontend (if separated) |
| **Supabase** | 500MB DB | PostgreSQL + Auth |
| **Hugging Face** | Free inference | AI model hosting |
| **PostHog** | 1M events/mo | Analytics |
| **Cloudinary** | 25GB storage | Patient image uploads |

---

## Quick Deploy Checklist

- [ ] Create Supabase project → get `DATABASE_URL`
- [ ] Update `application.properties` to use PostgreSQL
- [ ] Push code to GitHub
- [ ] Deploy to Railway → set env vars
- [ ] Set up Hugging Face API token for AI
- [ ] Add PostHog analytics to frontend
- [ ] Update CORS origins for production URLs
- [ ] Add JWT authentication (recommended for public use)
- [ ] Test all API endpoints at your Railway URL
- [ ] Share your public URL!

---

## Your Public API Endpoints (after deploy)

```
POST   /api/auth/register     — Register new patient
POST   /api/auth/login        — Login
GET    /api/patients           — List patients
GET    /api/patients/{id}      — Get patient
POST   /api/dentists           — Add dentist
GET    /api/dentists           — List dentists
POST   /api/appointments       — Book appointment
GET    /api/appointments       — List appointments
POST   /api/scans/upload       — Upload teeth scan
POST   /api/scans/{id}/analyze — AI analysis
GET    /api/prescriptions      — List prescriptions
```
