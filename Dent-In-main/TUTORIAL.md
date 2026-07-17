# Dent-in Tutorial — How to Run & Test Everything

> Step-by-step guide to run the website locally, test all features, and understand how it works.

---

## What You Need Installed

| Tool | Why | Install |
|------|-----|---------|
| **Java 21** | Run Spring Boot | https://adoptium.net |
| **Maven** | Build the project | https://maven.apache.org/download.cgi |
| **Browser** | Use the website | Chrome, Firefox, Edge |

Check they are installed:
```bash
java --version      # Should show "21.x.x"
mvn --version       # Should show "3.9.x"
```

---

## PART 1: Run the Website (2 Minutes)

### Step 1: Open Terminal
```bash
cd C:\Haackathon\dentin-unified
```

### Step 2: Build & Run
```bash
mvn spring-boot:run
```

### Step 3: Wait for This Output
```
Tomcat started on port(s): 8080
Started DentalClinicApplication in X seconds
```

### Step 4: Open Browser
Go to: **http://localhost:8080**

**You should see the Dent-in homepage with the tooth logo, navigation, and "Book Appointment" button.**

---

## PART 2: Test Each Feature (Walkthrough)

### Feature 1: Register a New Patient

1. Click **"Get started"** button (top right)
2. Fill in the form:
   - First name: `John`
   - Last name: `Doe`
   - Email: `john@test.com`
   - Phone: `+62 812 3456 789`
   - Password: `password123`
   - Confirm password: `password123`
3. Click **"Create account"**
4. You should see a toast: **"Account created"**
5. You are now on the Dashboard with your name displayed

**What happened behind the scenes:**
- `POST /api/auth/register` sent your data
- Backend created a Patient in H2 database
- Backend returned a JWT token
- Frontend stored the token in localStorage
- Dashboard now shows your patient data

---

### Feature 2: Login

1. Click **"Log out"** (top right)
2. Click **"Log in"**
3. Enter:
   - Email: `john@test.com`
   - Password: `password123`
4. Click **"Log in"**
5. You should see: **"Welcome back, John"**

**What happened:**
- `POST /api/auth/login` sent credentials
- Backend verified password hash
- Backend returned JWT token + patient data
- Frontend stored token for future API calls

---

### Feature 3: Browse Dentists

1. Click **"Find a Doctor"** in the navigation
2. You should see **10 dentists** loaded from the API:
   - 5 Specialists (Endodontist, Orthodontist, etc.)
   - 5 General Practitioners
3. Each card shows: name, specialization, clinic, rating, next available slot

**What happened:**
- `GET /api/dentists` fetched all dentists
- The `DataSeeder` created 10 dentists on first run

---

### Feature 4: Book an Appointment

1. Go to **"Find a Doctor"**
2. Click **"Book Appointment"** on any dentist card
3. A modal pops up — pick a date and time
4. Click **"Confirm Booking"**
5. You should see: **"Appointment booked"**
6. Go back to **Home** — your dashboard now shows the appointment card

**What happened:**
- `POST /api/appointments` created the booking
- Dashboard calls `GET /api/appointments/patient/{id}` to show it
- The appointment card shows dentist name, date, time, clinic

---

### Feature 5: Upload Teeth Scan & AI Analysis

1. Go to **Home** → scroll down to **Dashboard**
2. Find the **"Dental Condition Scanner"** card
3. Upload 3 photos (front, right, left) using the upload slots
4. Click **"Run AI Analysis"**
5. Wait — you should see:
   - A spinning loader: "Running AI dental analysis..."
   - Then results with a health score, detected issues, and recommendations

**What happened:**
- `POST /api/scans/upload` saved the front photo
- `POST /api/scans/{id}/analyze` triggered AI analysis
- If `HF_API_TOKEN` is set → calls Hugging Face API
- If not set → returns simulated analysis (still works!)
- A prescription was automatically created by Dr. Marco Belline

---

### Feature 6: View Dashboard Data

After booking + scanning, your dashboard shows:
- **Appointment Card** — dentist, date, time, status
- **Queue Number** — live queue status (if appointment is today)
- **Consultation Status** — appointment confirmed + AI analysis status
- **Medication** — prescription from the scan
- **Follow-up** — recommended actions
- **Health Score** — AI dental health score (0-100)
- **Dental History** — recent activity
- **Nearby Clinic** — map card

---

### Feature 7: API Console (Debug Tool)

1. Click the **"Dent-in API"** floating button (bottom right)
2. A drawer opens showing every API call made
3. You can see: method, path, status, response message
4. Click **"X"** to close, **"⌫"** to clear

---

## PART 3: Test with API Client (Postman / curl)

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Jane Smith","email":"jane@test.com","phone":"+62 811 1111 2222","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"jane@test.com","password":"password123"}'
```
Response includes `token` — use it for authenticated requests:
```bash
curl -X GET http://localhost:8080/api/patients/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### List Dentists
```bash
curl http://localhost:8080/api/dentists
```

### Book Appointment
```bash
curl -X POST http://localhost:8080/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientId":1,"dentistId":6,"appointmentDate":"2026-07-20","appointmentTime":"14:30:00","reason":"Checkup"}'
```

### Upload Scan
```bash
curl -X POST http://localhost:8080/api/scans/upload \
  -F "patientId=1" \
  -F "file=@photo.jpg"
```

### Analyze Scan
```bash
curl -X POST http://localhost:8080/api/scans/1/analyze
```

---

## PART 4: How the Code Connects

### Architecture Diagram
```
Browser (http://localhost:8080)
    │
    ├── index.html     ──── Navigation, forms, dashboard
    ├── styles.css      ──── All styling
    └── app.js          ──── API calls, routing, rendering
            │
            ▼
Spring Boot (port 8080)
    │
    ├── /api/auth/*        → AuthController → AuthService → JWT
    ├── /api/patients/*    → PatientController → PatientService → DB
    ├── /api/dentists/*    → DentistController → DentistService → DB
    ├── /api/appointments/*→ AppointmentController → AppointmentService → DB
    ├── /api/scans/*       → TeethScanController → TeethScanService → AI + DB
    └── /api/prescriptions/*→ PrescriptionController → PrescriptionService → DB
            │
            ▼
H2 Database (in-memory, dev)  OR  Supabase PostgreSQL (production)
```

### Request Flow
```
1. User clicks "Login"
2. app.js calls: DentinAPI.login(email, password)
3. DentinAPI sends: POST /api/auth/login with JSON body
4. AuthController receives request
5. AuthService verifies password hash
6. JwtUtil generates JWT token
7. Response: { success: true, data: { token, patientId, fullName, email } }
8. app.js stores token in localStorage
9. All future API calls include: Authorization: Bearer <token>
10. JwtFilter validates token on each request
```

---

## PART 5: All API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new patient |
| POST | `/api/auth/login` | Login (returns JWT) |
| GET | `/api/patients` | List all patients |
| GET | `/api/patients/{id}` | Get patient by ID |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients/{id}` | Update patient |
| DELETE | `/api/patients/{id}` | Delete patient |
| GET | `/api/patients/search?name=` | Search patients |
| GET | `/api/dentists` | List all dentists |
| GET | `/api/dentists/{id}` | Get dentist by ID |
| POST | `/api/dentists` | Create dentist |
| PUT | `/api/dentists/{id}` | Update dentist |
| DELETE | `/api/dentists/{id}` | Delete dentist |
| GET | `/api/dentists/active` | List active dentists |
| GET | `/api/appointments` | List all appointments |
| GET | `/api/appointments/{id}` | Get appointment |
| POST | `/api/appointments` | Book appointment |
| PATCH | `/api/appointments/{id}/status` | Update status |
| PATCH | `/api/appointments/{id}/cancel` | Cancel appointment |
| GET | `/api/appointments/patient/{id}` | Appointments by patient |
| GET | `/api/appointments/dentist/{id}` | Appointments by dentist |
| GET | `/api/scans` | List all scans |
| GET | `/api/scans/{id}` | Get scan |
| POST | `/api/scans/upload` | Upload teeth photo |
| POST | `/api/scans/{id}/analyze` | Run AI analysis |
| GET | `/api/scans/patient/{id}` | Scans by patient |
| DELETE | `/api/scans/{id}` | Delete scan |
| GET | `/api/prescriptions` | List all prescriptions |
| GET | `/api/prescriptions/{id}` | Get prescription |
| POST | `/api/prescriptions` | Create prescription |
| POST | `/api/prescriptions/{id}/send` | Send to patient |
| GET | `/api/prescriptions/patient/{id}` | Prescriptions by patient |
| GET | `/api/prescriptions/dentist/{id}` | Prescriptions by dentist |
| GET | `/api/prescriptions/unsent` | Unsent prescriptions |
| DELETE | `/api/prescriptions/{id}` | Delete prescription |

---

## PART 6: Troubleshooting

### "Port 8080 already in use"
```bash
# Find and kill the process
netstat -ano | findstr :8080
taskkill /PID <PID_NUMBER> /F
```

### "Java not found"
Install Java 21 from https://adoptium.net and restart terminal.

### "Maven not found"
Install Maven from https://maven.apache.org/download.cgi and add to PATH.

### Dashboard shows nothing after login
- Open browser console (F12) — check for errors
- Click the "Dent-in API" button — see if API calls are succeeding
- Make sure you registered first, then logged in

### AI scan returns "AI analysis unavailable"
- This is normal if `HF_API_TOKEN` is not set
- The app still works with simulated analysis
- To use real AI: set `HF_API_TOKEN` in `.env` file

### H2 Console (database browser)
- Go to: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:dentaldb`
- User: `sa`
- Password: (leave empty)
- Click "Connect"

---

## PART 7: What Each File Does

```
src/main/java/com/dentist/
├── DentalClinicApplication.java    ← Main entry point (run this)
├── config/
│   ├── WebConfig.java              ← CORS settings
│   ├── DataSeeder.java             ← Creates 10 dentists on first run
│   ├── SecurityConfig.java         ← Spring Security (JWT-based)
│   └── JwtFilter.java              ← Validates JWT on each request
├── controller/
│   ├── AuthController.java         ← /api/auth/* (register, login)
│   ├── PatientController.java      ← /api/patients/*
│   ├── DentistController.java      ← /api/dentists/*
│   ├── AppointmentController.java  ← /api/appointments/*
│   ├── TeethScanController.java    ← /api/scans/*
│   └── PrescriptionController.java ← /api/prescriptions/*
├── service/
│   ├── AuthService.java            ← Register/login logic + JWT
│   ├── PatientService.java         ← Patient CRUD
│   ├── DentistService.java         ← Dentist CRUD
│   ├── AppointmentService.java     ← Booking logic + slot conflicts
│   ├── TeethScanService.java       ← File upload + Hugging Face AI
│   └── PrescriptionService.java    ← Prescription management
├── entity/
│   ├── Patient.java                ← Patient database table
│   ├── Dentist.java                ← Dentist database table
│   ├── Appointment.java            ← Appointment database table
│   ├── TeethScan.java              ← Scan records table
│   └── Prescription.java           ← Prescription database table
├── dto/
│   ├── AuthResponse.java           ← {token, patientId, fullName, email}
│   ├── LoginRequest.java           ← {identifier, password}
│   ├── RegisterRequest.java        ← {fullName, email, password, ...}
│   ├── AppointmentRequest.java     ← Booking payload
│   ├── PrescriptionRequest.java    ← Prescription payload
│   └── ApiResponse.java            ← Standard API response wrapper
├── repository/
│   ├── PatientRepository.java      ← Database queries for patients
│   ├── DentistRepository.java      ← Database queries for dentists
│   ├── AppointmentRepository.java  ← Database queries for appointments
│   ├── TeethScanRepository.java    ← Database queries for scans
│   └── PrescriptionRepository.java ← Database queries for prescriptions
├── exception/
│   ├── ResourceNotFoundException.java  ← 404 error
│   └── GlobalExceptionHandler.java     ← Catches all errors
└── util/
    ├── PasswordUtil.java           ← Hash + verify passwords
    └── JwtUtil.java                ← Generate + validate JWT tokens

src/main/resources/
├── application.properties          ← Dev config (H2 database)
├── application-production.properties ← Prod config (Supabase)
└── static/
    ├── index.html                  ← All pages (SPA)
    ├── styles.css                  ← All styling
    └── app.js                      ← All frontend logic + API calls
```

---

## Quick Start Summary

```bash
# 1. Open terminal
cd C:\Haackathon\dentin-unified

# 2. Run
mvn spring-boot:run

# 3. Open browser
# http://localhost:8080

# 4. Register → Login → Find Doctor → Book → Scan → Done!
```
