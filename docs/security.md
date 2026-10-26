# BuildLink Security, Privacy & Compliance Guidelines

---

## 1. Authentication & Session Security
- **Password Storage:** Salted and hashed using Argon2 or bcrypt with a minimum cost factor of 12. Plaintext passwords are never stored or logged.
- **Session Tokens:** Stateless JWT tokens signed with SHA-256 HMAC or RSA. Access tokens have a short lifespan (15m - 2h); refresh tokens stored securely in `HttpOnly`, `SameSite=Lax/Strict`, `Secure` cookies.
- **Rate Limiting:** Express rate-limiting middleware on authentication and write endpoints (`/auth/login`, `/auth/register`, `/posts`) to prevent brute-force attacks and abuse.

## 2. Authorization & RBAC
- Explicit role-based access control (`Role: USER, ENGINEER, ADMIN`) evaluated on the backend for every protected endpoint.
- Users cannot elevate their own role or approve verification applications.
- Insecure Direct Object Reference (IDOR) protection: resource ownership checks on posts, comments, consultation bookings, and private messages.

## 3. Data Protection & Document Security
- Private verification documents (engineering degree certificates, professional registration licenses) stored in protected non-public storage with signed, short-lived download tokens.
- SQL Server injection prevention via TypeORM parameterized queries.
- Input sanitization and schema validation via Zod on all incoming HTTP requests.
