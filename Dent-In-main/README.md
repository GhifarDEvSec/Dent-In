# Dent-in — Unified App (Dent-in frontend × Haackathon backend)

One deployable Spring Boot project that merges two codebases:

- **Dent-in** — the patient-facing frontend (landing page, auth pages, Find a Doctor, dashboard with queue/scanner/prescriptions). Originally a static-file design preview that faked its data in `localStorage`.
- **Haackathon** — the Spring Boot 3.2 / Java 21 REST backend (`com.dentist`): patients, dentists, appointments with slot-conflict protection, prescriptions, and AI teeth-scan analysis (simulated).

The frontend now lives in `src/main/resources/static/` and is served by the backend itself. Every user action calls the real REST API on the same origin. A floating "Dent-in API" console in the UI shows each request/response live.

## Run it

Requirements: JDK 21, Maven.

```bash
mvn spring-boot:run
```

Then open **http://localhost:8080**. The H2 console is at `/h2-console` (JDBC URL `jdbc:h2:mem:dentaldb`, user `sa`, empty password).

On first start a seeder inserts the 10 dentists from the Dent-in directory, so "Find a Doctor" is populated immediately.

## What was added to make the two halves connect

The original backend had **no authentication** while the frontend is built around register/login. The merge adds the minimum needed:

| Addition | File(s) | Why |
|---|---|---|
| Password on Patient | `entity/Patient.java` (`passwordHash`, `passwordSalt`, `@JsonIgnore`) | Backend had no credential storage |
| Auth endpoints | `controller/AuthController.java`, `service/AuthService.java`, `dto/RegisterRequest.java`, `dto/LoginRequest.java` | `POST /api/auth/register`, `POST /api/auth/login` |
| Password hashing | `util/PasswordUtil.java` | Salted SHA-256, zero new dependencies |
| Dentist display fields | `entity/Dentist.java` (`clinic`, `rating`, `reviewsCount`, `experience`, `nextSlot`, `colorHex`, `initials`, `dentistType`) | Frontend doctor cards need them |
| Dentist seeder | `config/DataSeeder.java` | Populate the directory on first run |
| Patient lookups | `repository/PatientRepository.java` (`findByEmailIgnoreCase`, `findByPhone`) | Login by email **or** phone |
| Frontend | `resources/static/index.html`, `app.js`, `styles.css` | Dent-in UI, rewritten to `fetch()` the real API |

Everything else — controllers, services, entities, the slot-conflict rule, the simulated AI analysis output — is the original Haackathon code, unchanged.

## End-to-end flow to test

1. Register (`/api/auth/register`) → auto-login → dashboard.
2. Find a Doctor → book (`POST /api/appointments`). Book the **same dentist, date and time** from a second account to see the backend reject it: *"Dentist already has an appointment at this time"*.
3. On the dashboard, upload 3 photos in the scanner → Run AI Analysis. This calls `POST /api/scans/upload` (the front photo is stored as the scan file; images land in `./uploads/`) then `POST /api/scans/{id}/analyze`, which returns the simulated result (health score 78, confidence 92.5%). A prescription is then created via `POST /api/prescriptions` and appears in the Medication card.
4. Open the "Dent-in API" pill (bottom-right) to watch the calls.

## Known limitations — read before treating this as production-ready

- **Not compiled in the environment that produced this merge** (no Maven/JDK compiler was available there). The changes are additive and simple, but run `mvn compile` first and expect possibly a trivial fix or two.
- **Demo-grade auth.** No session tokens, no Spring Security: the frontend stores the patient id in `localStorage` and the API trusts ids in requests. Anyone can call any endpoint for any patient. Salted SHA-256 is used for hashing; replace with BCrypt/Argon2 (spring-security-crypto) and real sessions/JWT before any real use.
- **In-memory H2** — data resets on restart. Switch `application.properties` to the included PostgreSQL driver for persistence.
- **The AI analysis is simulated** (hardcoded in `TeethScanService.performAIAnalysis`) — same as the original Haackathon code. The `// TODO` for a real ML integration still stands.
- **Queue numbers, satisfaction stats, and the clinic mini-map are decorative** — carried over from the Dent-in design; there is no queue entity in the backend.
- The scanner UI collects 3 photos but the backend's scan record stores **one file per scan**; the front photo is uploaded as the representative image. Extending `TeethScan` to hold three paths is a straightforward follow-up.
